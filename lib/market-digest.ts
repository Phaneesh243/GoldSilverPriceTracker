import "server-only";
import { randomUUID } from "node:crypto";
import { fetchCryptoMarkets } from "./crypto-market-provider";
import { currencyPairs } from "./currencies";
import { getCurrencyRates } from "./currency-prices";
import { getAllMetalPrices } from "./metal-prices";
import { redis } from "./redis";
import { fetchLiveStockQuotes } from "./stock-quotes";
import { createMarketNotification, getProfile, getUserSettings, listAccountIds, listPushSubscriptions } from "./storage";
import { sendDeviceUpdate } from "./notification-transport";
import { emailAlertsConfigured, sendAlertEmail } from "./email";
import { reserveEmailQuota, unsubscribeUrl } from "./notification-email";
import { enqueueMarketJob } from "./market-jobs";
import { editionWindow, indiaDate, quoteAvailability, regularTradingDay, type MarketEdition } from "./market-schedule";

type Snapshot = { id: string; edition: MarketEdition; date: string; title: string; message: string; generatedAt: number; expiresAt: number; recipients: string[] };
const TTL = 30 * 86400;
const key = (id: string) => `gsp:v2:edition:${id}`;
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

async function lock<T>(name: string, work: () => Promise<T>) {
  if (!redis) throw new Error("Redis is required.");
  const token = randomUUID();
  if (!await redis.set(name, token, { nx: true, ex: 35 })) throw new Error("Job is already running; retry later.");
  try { return await work(); }
  finally { await redis.eval("if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end", [name], [token]); }
}
function row(label: string, value: number | null | undefined, source: string, asOf: string | null | undefined, maxAge: number, unit = "") {
  const status = quoteAvailability(value, asOf, maxAge);
  return `${label}: ${status === "unavailable" || status === "timestamp-unavailable" ? "Unavailable" : money(value!)}${unit ? " " + unit : ""} — ${status}; source: ${source}; as of: ${asOf || "not supplied"}`;
}
async function snapshot(edition: MarketEdition, date: string): Promise<Snapshot> {
  const id = `${date}:${edition}`;
  const stored = await redis!.get<Snapshot>(key(id));
  if (stored) return stored;
  const [metals, stocks, crypto, fx] = await Promise.allSettled([
    getAllMetalPrices("mumbai", "IN"), fetchLiveStockQuotes(["reliance", "tcs", "hdfc-bank", "icici-bank", "infosys"]),
    fetchCryptoMarkets(["bitcoin", "ethereum"]), getCurrencyRates(currencyPairs.filter((pair) => ["USD/INR", "EUR/INR"].includes(pair.symbol))),
  ]);
  const lines: string[] = [];
  if (metals.status === "fulfilled") {
    for (const metal of metals.value.metals) {
      if (!["gold", "silver"].includes(metal.key)) continue;
      if (metal.key === "gold" && metal.variants?.length) for (const variant of metal.variants.filter((item) => ["22K", "24K"].includes(item.label))) lines.push(row(`Gold ${variant.label}, Mumbai`, variant.price, metal.source, metal.updatedAt, 24 * 3600_000, metal.unitLabel));
      else lines.push(row(`${metal.name}, Mumbai${metal.key === "silver" ? " (purity not supplied by feed)" : " (purity unavailable)"}`, metal.price, metal.source, metal.updatedAt, 24 * 3600_000, metal.unitLabel));
    }
  } else lines.push("Gold and silver (Mumbai): unavailable — city-price provider failed.");
  if (stocks.status === "fulfilled" && stocks.value.length) for (const stock of stocks.value) lines.push(row(`${stock.ticker} (${stock.exchange})`, stock.price, stock.source, stock.timestamp, 20 * 60_000));
  else lines.push("Indian stock quotes: unavailable — Yahoo Finance chart.");
  if (crypto.status === "fulfilled" && crypto.value.length) for (const coin of crypto.value) lines.push(row(coin.symbol.toUpperCase(), coin.current_price, "CoinGecko", coin.last_updated, 10 * 60_000));
  else lines.push("BTC / ETH: unavailable — CoinGecko.");
  if (fx.status === "fulfilled" && fx.value.length) for (const pair of fx.value) lines.push(row(pair.pair.symbol, pair.rate, pair.source, pair.timestamp, 72 * 3600_000, "reference rate"));
  else lines.push("INR currency reference rates: unavailable — Frankfurter.");
  lines.push("Mutual fund NAVs, bond yields and insurance quotes are not included: no verified digest feed is configured.");
  lines.push("These are provider-reported/reference values, not exchange-guaranteed real-time prices. Opening editions may contain previous-session quotes. Metals and crypto do not follow equity trading hours.");
  const value: Snapshot = { id, edition, date, title: edition === "open" ? "Market opening edition · 09:15 IST" : "Market closing edition · 15:30 IST", message: lines.join("\n\n"), generatedAt: Date.now(), expiresAt: editionWindow(edition, date).expiresAt, recipients: await listAccountIds() };
  await redis!.set(key(id), value, { nx: true, ex: TTL });
  return (await redis!.get<Snapshot>(key(id)))!;
}
export async function dispatchMarketEdition(edition: MarketEdition, date = indiaDate(), start = 0) {
  if (!redis) throw new Error("Redis is required.");
  if (!editionWindow(edition, date).allowed) return { skipped: regularTradingDay(date).reason === "regular-session" ? "outside-delivery-window" : regularTradingDay(date).reason };
  const id = `${date}:${edition}`;
  return lock(`${key(id)}:dispatch-lock`, async () => {
    const existed = await redis!.exists(key(id));
    const saved = await snapshot(edition, date);
    if (!existed) {
      await enqueueMarketJob("/api/jobs/market-updates", { edition, date, start: 0 }, `${id}:page:0`);
      return { edition: id, snapshotSaved: true };
    }
    // Resume from the durable cursor after a function timeout or scheduler retry.
    const cursor = Math.max(start, await redis!.get<number>(`${key(id)}:cursor`) || 0);
    const end = Math.min(cursor + 5, saved.recipients.length);
    for (let index = cursor; index < end; index++) {
      const userId = saved.recipients[index];
      const [profile, settings] = await Promise.all([getProfile(userId), getUserSettings(userId)]);
      if (profile && !profile.anonymous && profile.status === "active" && settings.notifications.marketUpdates) await enqueueMarketJob("/api/jobs/market-updates/deliver", { edition, date, userId }, `${id}:${userId}`, true);
      await redis!.set(`${key(id)}:cursor`, index + 1, { ex: TTL });
    }
    if (end < saved.recipients.length) await enqueueMarketJob("/api/jobs/market-updates", { edition, date, start: end }, `${id}:page:${end}`);
    await redis!.set("gsp:v2:market-jobs:last-dispatch", { id, cursor: end, recipients: saved.recipients.length, at: Date.now() }, { ex: TTL });
    return { edition: id, queuedThrough: end, recipients: saved.recipients.length };
  });
}
export async function deliverMarketEdition(edition: MarketEdition, date: string, userId: string) {
  if (!redis) throw new Error("Redis is required.");
  const id = `${date}:${edition}`;
  const saved = await redis.get<Snapshot>(key(id));
  if (!saved || Date.now() >= saved.expiresAt) return { skipped: "expired-or-missing-edition" };
  if (!saved.recipients.includes(userId)) return { skipped: "not-in-edition" };
  return lock(`${key(id)}:${userId}:lock`, async () => {
    const [profile, settings] = await Promise.all([getProfile(userId), getUserSettings(userId)]);
    if (!profile || profile.anonymous || profile.status !== "active" || !settings.notifications.marketUpdates) return { skipped: "unsubscribed" };
    const deliveryKey = `${key(id)}:${userId}:delivery`;
    const state = await redis!.hgetall<Record<string, string>>(deliveryKey) || {};
    const mark = async (channel: string, status: string) => { await redis!.hset(deliveryKey, { [channel]: status }); await redis!.expire(deliveryKey, TTL); };
    // In-app delivery always happens before external services, and survives their failure.
    if (!state.inApp) { await createMarketNotification(userId, id, saved.title, saved.message, saved.generatedAt); await mark("inApp", "sent"); }
    const failures: string[] = [];
    if (settings.notifications.browserPush) {
      const devices = await listPushSubscriptions(userId);
      await Promise.all(devices.map(async (device) => {
        const channel = `push:${device.id}`;
        if (state[channel] === "sent" || state[channel] === "skipped") return;
        try {
          if (!(await getUserSettings(userId)).notifications.marketUpdates) return;
          const result = await sendDeviceUpdate(userId, device, { title: saved.title, body: "Your stocks, gold, silver, crypto and currency summary is ready. Open to see sources and timestamps.", tag: `gsp-${id}`, expiresAt: saved.expiresAt });
          await mark(channel, result);
        } catch { await mark(channel, "failed"); failures.push(channel); }
      }));
    }
    if (settings.notifications.emailAlerts && profile.emailVerified && profile.email && state.email !== "sent" && state.email !== "quota-skipped") {
      try {
        if (!emailAlertsConfigured()) throw new Error("Email service is not configured.");
        if (await reserveEmailQuota(`edition:${id}:${userId}`)) {
          const latest = await getUserSettings(userId);
          if (latest.notifications.marketUpdates && latest.notifications.emailAlerts) {
            const unsubscribe = unsubscribeUrl(userId);
            await sendAlertEmail({ to: profile.email, subject: saved.title, text: `${saved.message}\n\nUnsubscribe from email: ${unsubscribe}`, html: `<h1>${escape(saved.title)}</h1><p style="white-space:pre-line">${escape(saved.message)}</p><p><a href="${escape(unsubscribe)}">Unsubscribe from email editions</a></p>`, idempotencyKey: `gsp-v2-${id}-${userId}`, headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
            await mark("email", "sent");
          }
        } else await mark("email", "quota-skipped");
      } catch { await mark("email", "failed"); failures.push("email"); }
    }
    await redis!.set("gsp:v2:market-jobs:last-delivery", { id, at: Date.now(), failedChannels: failures.length }, { ex: TTL });
    if (failures.length) throw new Error("Some delivery channels failed; retry required.");
    return { delivered: id };
  });
}
