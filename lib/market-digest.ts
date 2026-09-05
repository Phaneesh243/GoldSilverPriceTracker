import "server-only";

import { fetchCryptoMarkets } from "./crypto-market-provider";
import { currencyPairs } from "./currencies";
import { getCurrencyRates } from "./currency-prices";
import { emailAlertsConfigured, sendAlertEmail } from "./email";
import { getAllMetalPrices } from "./metal-prices";
import { redis } from "./redis";
import { fetchLiveStockQuotes } from "./stock-quotes";
import { createNotification, getProfile, getUserSettings, listAccountIds } from "./storage";
import { sendUserPush } from "./user-alerts";

export type MarketDigestSlot = "morning" | "midday" | "close" | "evening";

function indiaDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function isIndiaWeekday() {
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(new Date());
  return day !== "Sat" && day !== "Sun";
}

function inr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function percent(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%` : "change unavailable";
}

function slotEnabled(slot: MarketDigestSlot, preferences: Awaited<ReturnType<typeof getUserSettings>>["notifications"]) {
  return slot === "morning" ? preferences.morningDigest : slot === "midday" ? preferences.middayDigest : slot === "close" ? preferences.marketCloseDigest : preferences.eveningDigest;
}

async function reserveEmailQuota() {
  if (!redis) return true;
  const limit = Math.max(1, Number(process.env.RESEND_DAILY_LIMIT || 90));
  const key = `gsp:v1:resend-quota:${indiaDate()}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 48 * 60 * 60);
  return count <= limit;
}

async function reserveDigest(userId: string, slot: MarketDigestSlot) {
  if (!redis) return true;
  return Boolean(await redis.set(`gsp:v1:digest:${indiaDate()}:${slot}:${userId}`, "1", { nx: true, ex: 72 * 60 * 60 }));
}

export async function sendMarketDigest(slot: MarketDigestSlot) {
  if (!isIndiaWeekday() && slot !== "evening") return { slot, skipped: "weekend", users: 0, sent: 0, failed: 0, unavailable: 0 };
  const generatedAt = new Date().toISOString();
  const [metalsResult, stocksResult, cryptoResult, currencyResult] = await Promise.allSettled([
    getAllMetalPrices("mumbai", "IN"),
    fetchLiveStockQuotes(),
    fetchCryptoMarkets(["bitcoin", "ethereum"]),
    getCurrencyRates(currencyPairs.filter((pair) => pair.symbol === "USD/INR" || pair.symbol === "EUR/INR").slice(0, 2)),
  ]);

  const metals = metalsResult.status === "fulfilled" ? metalsResult.value.metals.filter((item) => item.status === "available" && typeof item.price === "number") : [];
  const stocks = stocksResult.status === "fulfilled" ? stocksResult.value.filter((item) => Number.isFinite(item.price)).sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0)).slice(0, 5) : [];
  const crypto = cryptoResult.status === "fulfilled" ? cryptoResult.value.filter((item) => typeof item.current_price === "number") : [];
  const currencies = currencyResult.status === "fulfilled" ? currencyResult.value.filter((item) => item.status === "available" && typeof item.rate === "number") : [];
  if (!metals.length && !stocks.length && !crypto.length && !currencies.length) return { slot, skipped: "all-providers-unavailable", users: 0, sent: 0, failed: 0, unavailable: 4 };

  const metalText = metals.length ? metals.map((item) => `${item.name}: ${inr(item.price!)} (${percent(item.changePercentage)})`).join("; ") : "Metals: unavailable";
  const stockText = stocks.length ? `Stock movers: ${stocks.map((item) => `${item.ticker} ${inr(item.price)} (${percent(item.changePercent)})`).join(", ")}` : "Indian stocks: unavailable";
  const cryptoText = crypto.length ? `Crypto: ${crypto.map((item) => `${item.symbol.toUpperCase()} ${inr(item.current_price!)} (${percent(item.price_change_percentage_24h)})`).join(", ")}` : "Crypto: unavailable";
  const currencyText = currencies.length ? `FX: ${currencies.map((item) => `${item.pair.symbol} ${item.rate!.toLocaleString("en-IN", { maximumFractionDigits: 4 })}`).join(", ")}` : "Currencies: unavailable";
  const title = `${slot === "close" ? "Market close" : slot[0].toUpperCase() + slot.slice(1)} market update`;
  const message = [metalText, stockText, cryptoText, currencyText].join(" · ").slice(0, 950);
  const accountIds = await listAccountIds();
  const totals = { slot, users: accountIds.length, sent: 0, skipped: 0, failed: 0, inApp: 0, push: 0, email: 0, unavailable: [metals, stocks, crypto, currencies].filter((items) => !items.length).length, generatedAt };

  for (const userId of accountIds) {
    try {
      const [settings, profile] = await Promise.all([getUserSettings(userId), getProfile(userId)]);
      if (!settings.notifications.marketDigest || !slotEnabled(slot, settings.notifications) || !(await reserveDigest(userId, slot))) { totals.skipped += 1; continue; }
      const push = settings.notifications.browserPush ? await sendUserPush(userId, title, message, "/", `market-digest-${slot}-${indiaDate()}`) : { sent: 0, removed: 0 };
      totals.push += push.sent;
      let emailSent = false;
      if (settings.notifications.emailAlerts && profile?.email && !profile.anonymous && profile.emailVerified && emailAlertsConfigured() && await reserveEmailQuota()) {
        const rows = [metalText, stockText, cryptoText, currencyText].map((row) => `<li style="margin:0 0 10px">${row.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]!)}</li>`).join("");
        await sendAlertEmail({ to: profile.email, subject: title, text: `${message}\n\nGenerated: ${generatedAt}\nManage preferences: ${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")}/alerts`, html: `<div style="max-width:640px;margin:auto;font-family:Arial,sans-serif;color:#172033"><h1 style="font-size:24px">${title}</h1><p>Only currently available provider-backed values are included.</p><ul style="padding-left:20px">${rows}</ul><p style="font-size:12px;color:#64748b">Generated ${generatedAt}. Sources: Goodreturns/Gold API, Yahoo Finance chart, CoinGecko, Frankfurter.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/alerts">Manage notification preferences</a></p></div>`, idempotencyKey: `gsp-digest-${userId}-${indiaDate()}-${slot}` });
        emailSent = true;
        totals.email += 1;
      }
      await createNotification(userId, { type: "market", title, message, url: "/", delivery: { inApp: "sent", push: push.sent ? "sent" : settings.notifications.browserPush ? "failed" : "skipped", email: emailSent ? "sent" : settings.notifications.emailAlerts ? "failed" : "skipped" } });
      totals.inApp += 1;
      totals.sent += 1;
    } catch (error) {
      totals.failed += 1;
      console.error("Market digest delivery failed", { userId, slot, error });
    }
  }
  return totals;
}
