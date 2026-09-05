import webpush, { type PushSubscription } from "web-push";
import { getAllMetalPrices } from "./metal-prices";
import { emailAlertsConfigured, sendAlertEmail } from "./email";
import { fetchLiveStockQuote, type LiveStockQuote } from "./stock-quotes";
import { fetchCryptoMarkets, type LiveCryptoMarket } from "./crypto-market-provider";
import { getCurrencyRate } from "./currency-prices";
import type { CurrencyRate } from "./currencies";
import { indianStocks } from "./indian-stocks";
import {
  createNotification,
  getProfile,
  getUserSettings,
  listAccountIds,
  listAlerts,
  listPushSubscriptions,
  removePushSubscription,
  updateAlertEvaluation,
  type UserAlert,
} from "./storage";

const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const MAX_QUOTE_AGE_MS: Partial<Record<UserAlert["assetType"], number>> = {
  metal: 12 * 60 * 60 * 1000,
  stock: 20 * 60 * 1000,
  crypto: 10 * 60 * 1000,
  currency: 48 * 60 * 60 * 1000,
};

type LiveAlertQuote = {
  price: number;
  changePercentage: number | null;
  source: string;
  timestamp: string;
  route: string;
};

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;
  if (!publicKey || !privateKey || !email) return false;
  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  return true;
}

function normalizeMetalKey(alert: UserAlert) {
  const key = alert.assetKey.toLowerCase().replace(/^metal[:/]/, "");
  return key === "gold" || key === "silver" || key === "platinum" || key === "copper" ? key : null;
}

function conditionMet(alert: UserAlert, price: number, changePercentage: number | null) {
  if (alert.direction === "above") return typeof alert.targetPrice === "number" && price >= alert.targetPrice;
  if (alert.direction === "below") return typeof alert.targetPrice === "number" && price <= alert.targetPrice;
  return typeof changePercentage === "number" && Math.abs(changePercentage) >= (alert.movementPercent || 1);
}

function quoteIsFresh(alert: UserAlert, quote: LiveAlertQuote) {
  if (!Number.isFinite(quote.price)) return false;
  const quoteTime = new Date(quote.timestamp).getTime();
  const maximumAge = MAX_QUOTE_AGE_MS[alert.assetType];
  return Number.isFinite(quoteTime) && typeof maximumAge === "number" && Date.now() - quoteTime <= maximumAge && quoteTime <= Date.now() + 5 * 60_000;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }
}

function targetDescription(alert: UserAlert) {
  return alert.direction === "movement"
    ? `moved ${alert.movementPercent || 1}% or more`
    : `${alert.direction === "above" ? "crossed above" : "dropped below"} ${formatPrice(alert.targetPrice || 0, alert.currency)}`;
}

function pushConfigured() {
  return Boolean(configureWebPush());
}

export async function sendUserPush(userId: string, title: string, body: string, url: string | null, tag: string) {
  if (!pushConfigured()) return { sent: 0, removed: 0, skipped: "push-not-configured" };
  const subscriptions = await listPushSubscriptions(userId);
  let sent = 0;
  let removed = 0;
  for (const record of subscriptions) {
    const subscription: PushSubscription = { endpoint: record.endpoint, keys: { p256dh: record.p256dh, auth: record.auth } };
    try {
      await webpush.sendNotification(subscription, JSON.stringify({ title, body, url, tag }));
      sent += 1;
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) {
        await removePushSubscription(userId, record.id);
        removed += 1;
      }
    }
  }
  return { sent, removed };
}

async function evaluateAccount(userId: string, pricesByCity: Map<string, Awaited<ReturnType<typeof getAllMetalPrices>>>) {
  const alerts = await listAlerts(userId);
  const profile = await getProfile(userId);
  const settings = await getUserSettings(userId);
  let checked = 0;
  let triggered = 0;
  let notifications = 0;
  let pushes = 0;
  let emails = 0;
  let unavailable = 0;
  let stale = 0;
  let skipped = 0;
  const stockCache = new Map<string, LiveStockQuote | null>();
  const cryptoCache = new Map<string, LiveCryptoMarket | null>();
  const currencyCache = new Map<string, CurrencyRate | null>();

  for (const alert of alerts) {
    if (!alert.enabled) continue;
    checked += 1;
    if (!settings.notifications.priceAlerts) { skipped += 1; continue; }

    let quote: LiveAlertQuote | null = null;
    let assetName = alert.name || alert.symbol;
    if (alert.assetType === "metal") {
      const metalKey = normalizeMetalKey(alert);
      if (metalKey) {
        let prices = pricesByCity.get(alert.city);
        if (!prices) {
          prices = await getAllMetalPrices(alert.city, "IN");
          pricesByCity.set(alert.city, prices);
        }
        const metal = prices.metals.find((item) => item.key === metalKey);
        if (metal?.status === "available" && typeof metal.price === "number") {
          assetName = metal.name;
          quote = { price: metal.price, changePercentage: metal.changePercentage, source: metal.source, timestamp: metal.updatedAt, route: metal.route };
        }
      }
    } else if (alert.assetType === "stock") {
      const slug = alert.assetKey.toLowerCase().replace(/^stock[:/]/, "");
      const stock = indianStocks.find((item) => item.slug === slug);
      if (stock) {
        let live = stockCache.get(slug);
        if (live === undefined) {
          live = await fetchLiveStockQuote(stock.slug, stock.symbol);
          stockCache.set(slug, live);
        }
        if (live) quote = { price: live.price, changePercentage: live.changePercent, source: live.source, timestamp: live.timestamp, route: `/stocks/${slug}` };
      }
    } else if (alert.assetType === "crypto") {
      const slug = alert.assetKey.toLowerCase().replace(/^crypto[:/]/, "");
      let live = cryptoCache.get(slug);
      if (live === undefined) {
        live = (await fetchCryptoMarkets([slug]).catch(() => []))[0] || null;
        cryptoCache.set(slug, live);
      }
      if (live && typeof live.current_price === "number") {
        assetName = live.name;
        quote = { price: live.current_price, changePercentage: live.price_change_percentage_24h, source: "CoinGecko public market data", timestamp: live.last_updated || new Date().toISOString(), route: `/crypto/${slug}` };
      }
    } else if (alert.assetType === "currency") {
      const slug = alert.assetKey.toLowerCase().replace(/^currency[:/]/, "");
      let live = currencyCache.get(slug);
      if (live === undefined) {
        live = await getCurrencyRate(slug).catch(() => null);
        currencyCache.set(slug, live);
      }
      if (live?.status === "available" && typeof live.rate === "number") {
        assetName = live.pair.symbol;
        quote = { price: live.rate, changePercentage: live.changePercentage, source: live.source, timestamp: live.timestamp || new Date().toISOString(), route: `/currencies/${live.pair.slug}` };
      }
    }

    if (!quote) {
      unavailable += 1;
      continue;
    }
    if (!quoteIsFresh(alert, quote)) {
      stale += 1;
      continue;
    }
    const isMet = conditionMet(alert, quote.price, quote.changePercentage);
    const coolingDown = Boolean(alert.lastTriggeredAt && Date.now() - alert.lastTriggeredAt < ALERT_COOLDOWN_MS);
    if (!isMet || alert.lastConditionMet || coolingDown) {
      await updateAlertEvaluation(userId, alert.id, { conditionMet: isMet, provider: quote.source, quoteAt: quote.timestamp, value: quote.price });
      skipped += 1;
      continue;
    }

    const title = `${assetName} price alert`;
    const message = `${assetName} ${targetDescription(alert)}. Current price: ${formatPrice(quote.price, alert.currency)}.`;
    const timestamp = Date.now();
    const eventKey = `${alert.id}-${Math.floor(timestamp / ALERT_COOLDOWN_MS)}`;
    const results = await Promise.allSettled([
      settings.notifications.browserPush ? sendUserPush(userId, title, message, quote.route, `user-alert-${alert.id}`) : Promise.resolve({ sent: 0, removed: 0, skipped: "push-disabled" }),
      settings.notifications.emailAlerts && profile?.email && !profile.anonymous && emailAlertsConfigured()
        ? sendAlertEmail({
            to: profile.email,
            subject: `${title}: ${assetName}`,
            text: `${message}\n\nSource: ${quote.source}\nUpdated: ${quote.timestamp}`,
            html: `<p>${escapeHtml(message)}</p><p>Source: ${escapeHtml(quote.source)}<br>Updated: ${escapeHtml(quote.timestamp)}</p><p><a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")}${escapeHtml(quote.route)}">Open ${escapeHtml(assetName)}</a></p>`,
            idempotencyKey: `gsp-alert-${eventKey}`,
          })
        : Promise.resolve(null),
    ]);
    const pushResult = results[0];
    if (pushResult?.status === "fulfilled") pushes += pushResult.value.sent;
    const emailResult = results[1];
    if (emailResult?.status === "fulfilled" && emailResult.value) emails += 1;
    try {
      const created = await createNotification(userId, {
        type: "alert",
        title,
        message,
        url: quote.route,
        assetKey: alert.assetKey,
        delivery: {
          inApp: "sent",
          push: pushResult?.status === "fulfilled" && pushResult.value.sent > 0 ? "sent" : settings.notifications.browserPush ? "failed" : "skipped",
          email: emailResult?.status === "fulfilled" && emailResult.value ? "sent" : settings.notifications.emailAlerts ? "failed" : "skipped",
        },
      });
      notifications += created ? 1 : 0;
    } catch (error) {
      console.error("In-app alert notification creation failed", { userId, alertId: alert.id, error });
    }
    await updateAlertEvaluation(userId, alert.id, { conditionMet: true, provider: quote.source, quoteAt: quote.timestamp, value: quote.price, triggeredAt: timestamp });
    triggered += 1;
  }

  return { checked, triggered, notifications, pushes, emails, unavailable, stale, skipped };
}

export async function sendUserAlerts() {
  const accountIds = await listAccountIds();
  const pricesByCity = new Map<string, Awaited<ReturnType<typeof getAllMetalPrices>>>();
  const totals = { accounts: accountIds.length, checked: 0, triggered: 0, notifications: 0, pushes: 0, emails: 0, unavailable: 0, stale: 0, skipped: 0 };
  for (const userId of accountIds) {
    try {
      const result = await evaluateAccount(userId, pricesByCity);
      totals.checked += result.checked;
      totals.triggered += result.triggered;
      totals.notifications += result.notifications;
      totals.pushes += result.pushes;
      totals.emails += result.emails;
      totals.unavailable += result.unavailable;
      totals.stale += result.stale;
      totals.skipped += result.skipped;
    } catch (error) {
      console.error("User alert evaluation failed", { userId, error });
    }
  }
  return { ...totals, emailConfigured: emailAlertsConfigured(), pushConfigured: pushConfigured() };
}
