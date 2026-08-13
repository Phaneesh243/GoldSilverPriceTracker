import webpush, { PushSubscription } from "web-push";
import { getLiveCityPrices } from "./live-prices";
import { redis } from "./redis";

const SUBSCRIPTION_KEY = "notifications:subs"; // hash: endpoint -> StoredSubscription JSON
const SNAPSHOT_KEY = "notifications:snap"; // hash: city -> latest 22K gold and silver snapshot
const DEFAULT_CITY = "mumbai";
const DEFAULT_PURITY: Purity = "22K";
const SUPPORTED_PURITIES = ["24K", "22K", "18K"] as const;
const BIG_MOVE_THRESHOLD_PERCENT = 1;
const SNAPSHOT_TTL_SECONDS = 60 * 60 * 6;

export type Purity = (typeof SUPPORTED_PURITIES)[number];
export type DigestSlot = "morning" | "midday" | "evening";

export type StoredSubscription = {
  endpoint: string;
  subscription: PushSubscription;
  city: string;
  purity: Purity;
  createdAt: number;
};

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!publicKey || !privateKey || !email) {
    return false;
  }

  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  return true;
}

export function notificationsConfigured() {
  return Boolean(redis && configureWebPush());
}

function inr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatChange(percent: number) {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

function titleCase(value: string) {
  return value
    .split(/[-\s]+/)
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function nowInIst(date = new Date()) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function isIstWeekday(date = new Date()) {
  const day = nowInIst(date).getDay();
  return day >= 1 && day <= 5;
}

function isValidSubscription(value: unknown): value is PushSubscription {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const endpoint = candidate.endpoint;
  const keys = candidate.keys as Record<string, unknown> | undefined;

  return (
    typeof endpoint === "string" &&
    endpoint.startsWith("https://") &&
    !!keys &&
    typeof keys.p256dh === "string" &&
    typeof keys.auth === "string"
  );
}

function normalizePurity(value: unknown): Purity {
  if (typeof value === "string") {
    const upper = value.toUpperCase() as Purity;
    if ((SUPPORTED_PURITIES as readonly string[]).includes(upper)) {
      return upper;
    }
  }
  return DEFAULT_PURITY;
}

function normalizeCity(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_CITY;
  }
  return value.trim().toLowerCase();
}

function trimSubscription(subscription: PushSubscription): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  } as PushSubscription;
}

export async function saveSubscription(input: {
  subscription: unknown;
  city?: unknown;
  purity?: unknown;
}) {
  if (!redis) {
    throw new Error("Redis is required to store push subscriptions.");
  }

  if (!isValidSubscription(input.subscription)) {
    throw new Error("Invalid push subscription payload.");
  }

  const cleaned = trimSubscription(input.subscription);
  const record: StoredSubscription = {
    endpoint: cleaned.endpoint,
    subscription: cleaned,
    city: normalizeCity(input.city),
    purity: normalizePurity(input.purity),
    createdAt: Date.now(),
  };

  await redis.hset(SUBSCRIPTION_KEY, { [cleaned.endpoint]: JSON.stringify(record) });
}

export async function removeSubscription(endpoint: string) {
  if (!redis) {
    return;
  }

  if (typeof endpoint !== "string" || !endpoint) {
    throw new Error("Endpoint is required to unsubscribe.");
  }

  await redis.hdel(SUBSCRIPTION_KEY, endpoint);
}

function parseStored(raw: unknown): StoredSubscription | null {
  if (!raw) {
    return null;
  }

  try {
    const value = typeof raw === "string" ? JSON.parse(raw) : (raw as StoredSubscription);
    if (!value || typeof value !== "object" || !isValidSubscription(value.subscription)) {
      return null;
    }
    return {
      endpoint: value.endpoint || value.subscription.endpoint,
      subscription: value.subscription,
      city: normalizeCity(value.city),
      purity: normalizePurity(value.purity),
      createdAt: typeof value.createdAt === "number" ? value.createdAt : Date.now(),
    };
  } catch {
    return null;
  }
}

async function loadAllSubscriptions(): Promise<StoredSubscription[]> {
  if (!redis) {
    return [];
  }

  const all = (await redis.hgetall<Record<string, unknown>>(SUBSCRIPTION_KEY)) || {};
  return Object.values(all)
    .map(parseStored)
    .filter((value): value is StoredSubscription => value !== null);
}

type SendOutcome = "sent" | "removed" | "error";

async function sendOne(record: StoredSubscription, payload: string): Promise<SendOutcome> {
  try {
    await webpush.sendNotification(record.subscription, payload);
    return "sent";
  } catch (error) {
    const statusCode =
      typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;

    if (statusCode === 404 || statusCode === 410) {
      await removeSubscription(record.endpoint);
      return "removed";
    }

    return "error";
  }
}

function buildDigestPayload(
  slot: DigestSlot,
  cityLabel: string,
  citySlug: string,
  purity: Purity,
  goldPrice: number,
  goldChangePercent: number,
  silverPrice: number,
  silverChangePercent: number,
) {
  const base = {
    url: `/gold-price/${citySlug}`,
    tag: `digest-${slot}-${citySlug}`,
  };

  if (slot === "morning") {
    return JSON.stringify({
      ...base,
      title: `Morning gold rate - ${cityLabel}`,
      body: `${purity} gold opens at ${inr(goldPrice)} per gram. Silver at ${inr(silverPrice)} per gram.`,
    });
  }

  if (slot === "midday") {
    return JSON.stringify({
      ...base,
      title: `Midday update - ${cityLabel}`,
      body: `${purity} gold ${inr(goldPrice)}/g (${formatChange(goldChangePercent)}). Silver ${inr(silverPrice)}/g (${formatChange(silverChangePercent)}).`,
    });
  }

  return JSON.stringify({
    ...base,
    title: `Evening close - ${cityLabel}`,
    body: `${purity} gold closed at ${inr(goldPrice)}/g (${formatChange(goldChangePercent)} today). Silver ${inr(silverPrice)}/g.`,
  });
}

function groupByCity(records: StoredSubscription[]) {
  const groups = new Map<string, StoredSubscription[]>();
  for (const record of records) {
    const list = groups.get(record.city) || [];
    list.push(record);
    groups.set(record.city, list);
  }
  return groups;
}

export async function sendDigest(slot: DigestSlot) {
  if (!redis) {
    throw new Error("Redis is required to send push notifications.");
  }

  if (!configureWebPush()) {
    throw new Error("VAPID keys are required to send push notifications.");
  }

  if (!isIstWeekday()) {
    return { slot, skipped: "weekend", subscribers: 0, sent: 0, removed: 0 };
  }

  const subscriptions = await loadAllSubscriptions();
  if (!subscriptions.length) {
    return { slot, skipped: "no-subscribers", subscribers: 0, sent: 0, removed: 0 };
  }

  const groups = groupByCity(subscriptions);
  let sent = 0;
  let removed = 0;
  const cityErrors: string[] = [];

  for (const [citySlug, records] of groups) {
    let live;
    try {
      live = await getLiveCityPrices(citySlug);
    } catch {
      cityErrors.push(citySlug);
      continue;
    }

    for (const record of records) {
      const goldRow =
        live.gold.find((item) => item.purity === record.purity) ||
        live.gold.find((item) => item.purity === DEFAULT_PURITY);

      if (!goldRow) {
        continue;
      }

      const payload = buildDigestPayload(
        slot,
        live.city || titleCase(citySlug),
        citySlug,
        (goldRow.purity as Purity) || record.purity,
        goldRow.pricePerGram,
        goldRow.changePercentage,
        live.silver.pricePerGram,
        live.silver.changePercentage,
      );

      const outcome = await sendOne(record, payload);
      if (outcome === "sent") sent += 1;
      else if (outcome === "removed") removed += 1;
    }
  }

  return {
    slot,
    subscribers: subscriptions.length,
    sent,
    removed,
    cityErrors,
  };
}

type Snapshot = { gold22: number; silver: number; at: number };
type AlertMetal = "gold" | "silver";
type MoveAlert = {
  metal: AlertMetal;
  previousPrice: number;
  currentPrice: number;
  changePercent: number;
};

function parseSnapshot(raw: Snapshot | string | null): Snapshot | null {
  if (!raw) {
    return null;
  }

  if (typeof raw === "object") {
    return raw;
  }

  try {
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

function movementPercent(currentPrice: number, previousPrice: number) {
  if (!previousPrice) {
    return 0;
  }

  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

function buildMoveAlerts(previous: Snapshot, next: Snapshot): MoveAlert[] {
  const goldChange = movementPercent(next.gold22, previous.gold22);
  const silverChange = movementPercent(next.silver, previous.silver);
  const alerts: MoveAlert[] = [];

  if (Math.abs(goldChange) >= BIG_MOVE_THRESHOLD_PERCENT) {
    alerts.push({
      metal: "gold",
      previousPrice: previous.gold22,
      currentPrice: next.gold22,
      changePercent: goldChange,
    });
  }

  if (Math.abs(silverChange) >= BIG_MOVE_THRESHOLD_PERCENT) {
    alerts.push({
      metal: "silver",
      previousPrice: previous.silver,
      currentPrice: next.silver,
      changePercent: silverChange,
    });
  }

  return alerts;
}

function buildMovePayload(cityLabel: string, citySlug: string, alert: MoveAlert) {
  const direction = alert.changePercent >= 0 ? "up" : "down";
  const metalLabel = alert.metal === "gold" ? "22K gold" : "silver";

  return JSON.stringify({
    title: `${metalLabel} ${direction} ${formatChange(alert.changePercent)} - ${cityLabel}`,
    body: `${inr(alert.previousPrice)} to ${inr(alert.currentPrice)} per gram.`,
    url: `/gold-price/${citySlug}`,
    tag: `price-alert-${alert.metal}-${citySlug}-${Math.round(alert.currentPrice * 100)}`,
  });
}

export async function sendBigMoveAlerts() {
  if (!redis) {
    throw new Error("Redis is required to send push notifications.");
  }

  if (!configureWebPush()) {
    throw new Error("VAPID keys are required to send push notifications.");
  }

  if (!isIstWeekday()) {
    return { skipped: "weekend", sent: 0, removed: 0, movedCities: [] as string[] };
  }

  const hour = nowInIst().getHours();
  if (hour < 9 || hour > 17) {
    return { skipped: "off-hours", sent: 0, removed: 0, movedCities: [] as string[] };
  }

  const subscriptions = await loadAllSubscriptions();
  if (!subscriptions.length) {
    return { skipped: "no-subscribers", sent: 0, removed: 0, movedCities: [] as string[] };
  }

  const groups = groupByCity(subscriptions);
  const redisClient = redis;
  let sent = 0;
  let removed = 0;
  const movedCities: string[] = [];

  for (const [citySlug, records] of groups) {
    let live;
    try {
      live = await getLiveCityPrices(citySlug);
    } catch {
      continue;
    }

    const gold22 = live.gold.find((item) => item.purity === "22K");
    if (!gold22) continue;

    const snapField = citySlug;
    const previous = parseSnapshot(await redisClient.hget<Snapshot | string>(SNAPSHOT_KEY, snapField));

    const next: Snapshot = {
      gold22: gold22.pricePerGram,
      silver: live.silver.pricePerGram,
      at: Date.now(),
    };

    await redisClient.hset(SNAPSHOT_KEY, { [snapField]: JSON.stringify(next) });
    await redisClient.expire(SNAPSHOT_KEY, SNAPSHOT_TTL_SECONDS);

    if (!previous || !previous.gold22 || !previous.silver) {
      continue;
    }

    const alerts = buildMoveAlerts(previous, next);
    if (!alerts.length) {
      continue;
    }

    movedCities.push(citySlug);
    for (const alert of alerts) {
      const payload = buildMovePayload(live.city || titleCase(citySlug), citySlug, alert);

      for (const record of records) {
        const outcome = await sendOne(record, payload);
        if (outcome === "sent") sent += 1;
        else if (outcome === "removed") removed += 1;
      }
    }
  }

  return { sent, removed, movedCities };
}
