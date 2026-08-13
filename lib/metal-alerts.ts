import webpush, { PushSubscription } from "web-push";
import { getAllMetalPrices } from "./metal-prices";
import { redis } from "./redis";
import type { MetalKey } from "./metals";

const SUBSCRIPTION_KEY = "notifications:subs";
const TARGET_ALERT_KEY = "alerts:price-targets";
const TARGET_ALERT_COOLDOWN_KEY = "alerts:last-triggered";
const COOLDOWN_SECONDS = 60 * 60 * 6;

type StoredSubscription = {
  endpoint: string;
  subscription: PushSubscription;
  city: string;
};

export type TargetAlert = {
  id: string;
  endpoint: string;
  metal: MetalKey;
  city: string;
  direction: "above" | "below" | "movement";
  targetPrice: number | null;
  movementPercent: number | null;
  createdAt: number;
};

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;
  if (!publicKey || !privateKey || !email) return false;
  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  return true;
}

function alertKey(alert: TargetAlert) {
  return `${alert.endpoint}:${alert.id}`;
}

function parseRecord<T>(raw: unknown): T | null {
  if (!raw) return null;
  try {
    return typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T);
  } catch {
    return null;
  }
}

export async function saveTargetAlert(input: Omit<TargetAlert, "id" | "createdAt">) {
  if (!redis) throw new Error("Redis is required to save price alerts.");
  if (!input.endpoint || !input.metal || !input.city || !input.direction) {
    throw new Error("Missing alert fields.");
  }
  if (input.direction !== "movement" && (!input.targetPrice || input.targetPrice <= 0)) {
    throw new Error("Enter a valid target price.");
  }

  const id = `${input.metal}-${input.city}-${input.direction}-${input.targetPrice || input.movementPercent || 1}`;
  const alert: TargetAlert = { ...input, id, createdAt: Date.now() };
  await redis.hset(TARGET_ALERT_KEY, { [alertKey(alert)]: JSON.stringify(alert) });
  return alert;
}

async function loadAlerts() {
  if (!redis) return [];
  const all = (await redis.hgetall<Record<string, unknown>>(TARGET_ALERT_KEY)) || {};
  return Object.values(all)
    .map((raw) => parseRecord<TargetAlert>(raw))
    .filter((alert): alert is TargetAlert => Boolean(alert?.endpoint && alert.metal));
}

async function loadSubscription(endpoint: string) {
  if (!redis) return null;
  return parseRecord<StoredSubscription>(await redis.hget(SUBSCRIPTION_KEY, endpoint));
}

function conditionMet(alert: TargetAlert, price: number | null, changePercentage: number | null) {
  if (typeof price !== "number") return false;
  if (alert.direction === "above") return typeof alert.targetPrice === "number" && price >= alert.targetPrice;
  if (alert.direction === "below") return typeof alert.targetPrice === "number" && price <= alert.targetPrice;
  return typeof changePercentage === "number" && Math.abs(changePercentage) >= (alert.movementPercent || 1);
}

export async function sendTargetPriceAlerts() {
  if (!redis) throw new Error("Redis is required to send price alerts.");
  if (!configureWebPush()) throw new Error("VAPID keys are required to send price alerts.");

  const alerts = await loadAlerts();
  if (!alerts.length) return { checked: 0, sent: 0, skipped: "no-alerts" };

  let sent = 0;
  let checked = 0;
  const cityCache = new Map<string, Awaited<ReturnType<typeof getAllMetalPrices>>>();

  for (const alert of alerts) {
    checked += 1;
    const cooldownKey = `${alert.endpoint}:${alert.id}`;
    const cooldown = await redis.get(TARGET_ALERT_COOLDOWN_KEY + ":" + cooldownKey);
    if (cooldown) continue;

    let current = cityCache.get(alert.city);
    if (!current) {
      current = await getAllMetalPrices(alert.city, "IN");
      cityCache.set(alert.city, current);
    }

    const metal = current.metals.find((item) => item.key === alert.metal);
    if (!metal || !conditionMet(alert, metal.price, metal.changePercentage)) continue;

    const subscription = await loadSubscription(alert.endpoint);
    if (!subscription?.subscription) continue;

    const targetText =
      alert.direction === "movement"
        ? `moved ${alert.movementPercent || 1}% or more`
        : `${alert.direction === "above" ? "crossed above" : "dropped below"} ₹${alert.targetPrice}`;

    await webpush.sendNotification(
      subscription.subscription,
      JSON.stringify({
        title: `${metal.name} price alert`,
        body: `${metal.name} ${targetText}. Current: ₹${metal.price?.toLocaleString("en-IN")}.`,
        url: metal.route,
        tag: `target-alert-${alert.id}`,
      }),
    );

    await redis.set(TARGET_ALERT_COOLDOWN_KEY + ":" + cooldownKey, Date.now(), { ex: COOLDOWN_SECONDS });
    sent += 1;
  }

  return { checked, sent };
}
