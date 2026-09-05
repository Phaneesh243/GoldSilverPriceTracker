import { cookies } from "next/headers";
import { createHash, randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { redis } from "./redis";
import type { MetalKey } from "./metals";

const scrypt = promisify(nodeScrypt);

export const STORAGE_COOKIE = "gsp_anon_id";
export const SESSION_COOKIE = "gsp_session";
export const STORAGE_VERSION = "gsp:v1";
const ACCOUNT_INDEX_KEY = `${STORAGE_VERSION}:accounts`;

const MAX_WATCHLIST_ITEMS = 50;
const MAX_TRANSACTIONS = 5000;
const MAX_ALERTS = 20;
const MAX_NOTIFICATIONS = 200;
const MAX_ACTIVITY = 200;
const MAX_CALCULATIONS = 100;
const MAX_CALCULATOR_PRESETS = 30;
const MAX_SAVED_NEWS = 200;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const ANONYMOUS_TTL_SECONDS = 60 * 60 * 24 * 365;

export type AccountStatus = "active" | "disabled";
export type ThemePreference = "light" | "dark" | "system";
export type AssetType = "metal" | "stock" | "crypto" | "fund" | "bond" | "currency" | "other";
export type TransactionSide = "buy" | "sell" | "dividend" | "deposit" | "withdrawal" | "fee";
export type AlertDirection = "above" | "below" | "movement";

export type UserProfile = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  passwordHash: string | null;
  status: AccountStatus;
  emailVerified: boolean;
  anonymous: boolean;
  createdAt: number;
  updatedAt: number;
};

export type UserSettings = {
  theme: ThemePreference;
  currency: string;
  country: string;
  city: string;
  timezone: string;
  language: string;
  defaultMetal: MetalKey;
  notifications: {
    priceAlerts: boolean;
    browserPush: boolean;
    emailAlerts: boolean;
    marketUpdates: boolean;
    marketDigest: boolean;
    morningDigest: boolean;
    middayDigest: boolean;
    marketCloseDigest: boolean;
    eveningDigest: boolean;
    news: boolean;
    providerOutages: boolean;
    dailyDigest: boolean;
  };
  updatedAt: number;
};

export type WatchlistItem = {
  id: string;
  assetKey: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  route?: string;
  market?: string;
  addedAt: number;
  updatedAt: number;
};

export type PortfolioTransaction = {
  id: string;
  clientRequestId: string | null;
  assetKey: string | null;
  symbol: string;
  name: string | null;
  assetType: AssetType;
  side: TransactionSide;
  quantity: number;
  price: number;
  fees: number;
  currency: string;
  transactionDate: string;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

export type PortfolioPosition = {
  assetKey: string;
  symbol: string;
  name: string | null;
  assetType: AssetType;
  quantity: number;
  costBasis: number;
  averagePrice: number;
  realizedProfitLoss: number;
  currency: string;
};

export type PortfolioSummary = {
  costBasis: number;
  realizedProfitLoss: number;
  cashFlow: number;
  transactionCount: number;
  positions: PortfolioPosition[];
  updatedAt: number;
};

export type UserAlert = {
  id: string;
  assetKey: string;
  symbol: string;
  name: string | null;
  assetType: AssetType;
  direction: AlertDirection;
  targetPrice: number | null;
  movementPercent: number | null;
  city: string;
  currency: string;
  enabled: boolean;
  lastTriggeredAt: number | null;
  lastConditionMet: boolean;
  lastProvider: string | null;
  lastQuoteAt: string | null;
  lastValue: number | null;
  createdAt: number;
  updatedAt: number;
};

export type UserNotification = {
  id: string;
  type: "alert" | "market" | "news" | "system";
  title: string;
  message: string;
  url: string | null;
  assetKey: string | null;
  read: boolean;
  createdAt: number;
  expiresAt: number | null;
  delivery: {
    inApp: "sent" | "failed";
    push: "sent" | "failed" | "skipped";
    email: "sent" | "failed" | "skipped";
  } | null;
};

export type ActivityRecord = {
  id: string;
  action: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: number;
};

export type SavedCalculation = {
  id: string;
  calculatorType: string;
  metal: string | null;
  inputs: Record<string, string | number | boolean | null>;
  result: Record<string, string | number | boolean | null>;
  currency: string;
  city: string;
  createdAt: number;
  updatedAt: number;
};

export type CalculatorPreset = {
  id: string;
  name: string;
  calculatorType: string;
  inputs: Record<string, string | number | boolean | null>;
  createdAt: number;
  updatedAt: number;
};

export type SavedNewsItem = {
  id: string;
  articleId: string;
  slug: string;
  title: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  savedAt: number;
};

export type NewsPreferences = {
  metals: string[];
  categories: string[];
  country: string;
  language: string;
  dailyDigest: boolean;
  breakingNews: boolean;
  updatedAt: number;
};

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  platform: string | null;
  createdAt: number;
  lastUsedAt: number;
};

export type StorageUser = {
  id: string;
  anonymous: boolean;
  profile: UserProfile;
};

export class StorageUnavailableError extends Error {
  constructor() {
    super("Redis storage is not configured.");
    this.name = "StorageUnavailableError";
  }
}

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

function requireRedis() {
  if (!redis) throw new StorageUnavailableError();
  return redis;
}

function now() {
  return Date.now();
}

function clean(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanLower(value: unknown, fallback = "") {
  return clean(value, fallback).toLowerCase();
}

function positiveNumber(value: unknown, label: string, allowZero = false) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    throw new StorageValidationError(`${label} must be a valid ${allowZero ? "non-negative" : "positive"} number.`);
  }
  return number;
}

function optionalPositiveNumber(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  return positiveNumber(value, label);
}

function parseJson<T>(raw: unknown): T | null {
  if (!raw) return null;
  try {
    return typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T);
  } catch {
    return null;
  }
}

function userPrefix(userId: string) {
  if (!/^[a-zA-Z0-9_-]{8,160}$/.test(userId)) throw new StorageValidationError("Invalid user identity.");
  return `${STORAGE_VERSION}:user:${userId}`;
}

function collectionKey(userId: string, collection: string) {
  return `${userPrefix(userId)}:${collection}`;
}

function itemId(value: unknown, fallbackPrefix: string) {
  const candidate = cleanLower(value);
  return candidate ? candidate.replace(/[^a-z0-9:_-]/g, "-").slice(0, 120) : `${fallbackPrefix}_${randomUUID()}`;
}

async function readHash<T>(key: string) {
  const values = (await requireRedis().hgetall<Record<string, unknown>>(key)) || {};
  return Object.values(values)
    .map((value) => parseJson<T>(value))
    .filter((value): value is T => value !== null);
}

async function writeHash(key: string, id: string, value: unknown) {
  await requireRedis().hset(key, { [id]: JSON.stringify(value) });
}

function sortNewest<T extends { createdAt?: number; updatedAt?: number; addedAt?: number; savedAt?: number }>(items: T[]) {
  return items.sort((a, b) => (b.updatedAt ?? b.createdAt ?? b.addedAt ?? b.savedAt ?? 0) - (a.updatedAt ?? a.createdAt ?? a.addedAt ?? a.savedAt ?? 0));
}

function defaultSettings(): UserSettings {
  return {
    theme: "system",
    currency: "INR",
    country: "IN",
    city: "mumbai",
    timezone: "Asia/Kolkata",
    language: "en",
    defaultMetal: "gold",
    notifications: {
      priceAlerts: true,
      browserPush: false,
      emailAlerts: false,
      marketUpdates: false,
      marketDigest: false,
      morningDigest: false,
      middayDigest: false,
      marketCloseDigest: false,
      eveningDigest: false,
      news: false,
      providerOutages: false,
      dailyDigest: false,
    },
    updatedAt: now(),
  };
}

function defaultProfile(id: string, anonymous: boolean): UserProfile {
  const timestamp = now();
  return {
    id,
    email: null,
    username: null,
    displayName: null,
    passwordHash: null,
    status: "active",
    emailVerified: false,
    anonymous,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function saveProfile(profile: UserProfile) {
  await requireRedis().set(`${STORAGE_VERSION}:profile:${profile.id}`, JSON.stringify(profile));
  return profile;
}

export async function getProfile(userId: string) {
  return parseJson<UserProfile>(await requireRedis().get(`${STORAGE_VERSION}:profile:${userId}`));
}

export async function ensureStorageUser(userId: string, anonymous = true): Promise<StorageUser> {
  const existing = await getProfile(userId);
  if (existing) return { id: userId, anonymous: existing.anonymous, profile: existing };
  const profile = await saveProfile(defaultProfile(userId, anonymous));
  await requireRedis().set(`${STORAGE_VERSION}:user:${userId}:settings`, JSON.stringify(defaultSettings()));
  return { id: userId, anonymous, profile };
}

export async function getOrCreateStorageUser() {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(STORAGE_COOKIE)?.value;
  const userId = existingId && /^[a-zA-Z0-9_-]{8,160}$/.test(existingId) ? existingId : `anon_${randomUUID()}`;
  const user = await ensureStorageUser(userId, true);
  if (!existingId) {
    cookieStore.set(STORAGE_COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ANONYMOUS_TTL_SECONDS,
      path: "/",
    });
  }
  return user;
}

export async function getUserSettings(userId: string) {
  const stored = parseJson<UserSettings>(await requireRedis().get(collectionKey(userId, "settings")));
  const legacyAlertOptIn = stored?.notifications?.priceAlerts === true;
  return {
    ...defaultSettings(),
    ...(stored || {}),
    notifications: {
      ...defaultSettings().notifications,
      ...(stored?.notifications || {}),
      browserPush: stored?.notifications?.browserPush ?? legacyAlertOptIn,
      emailAlerts: stored?.notifications?.emailAlerts ?? legacyAlertOptIn,
    },
  };
}

export async function updateUserProfile(userId: string, input: { displayName?: unknown; username?: unknown }) {
  const r = requireRedis();
  const profile = await getProfile(userId);
  if (!profile) throw new StorageValidationError("User profile not found.");
  const nextUsername = input.username === undefined ? profile.username : normalizeUsername(input.username);
  if (nextUsername && nextUsername !== profile.username) {
    const claimed = await r.set(usernameLookup(nextUsername), userId, { nx: true });
    if (!claimed) throw new StorageValidationError("That username is already taken.");
    if (profile.username) await r.del(usernameLookup(profile.username));
  }
  const updated: UserProfile = { ...profile, username: nextUsername, displayName: clean(input.displayName, profile.displayName || nextUsername || "").slice(0, 80) || null, updatedAt: now() };
  await saveProfile(updated);
  return updated;
}

export async function updateUserSettings(userId: string, input: Partial<UserSettings>) {
  const current = await getUserSettings(userId);
  const next: UserSettings = {
    ...current,
    ...input,
    currency: cleanLower(input.currency, current.currency).toUpperCase().slice(0, 8),
    country: cleanLower(input.country, current.country).toUpperCase().slice(0, 4),
    city: cleanLower(input.city, current.city).slice(0, 80),
    language: cleanLower(input.language, current.language).slice(0, 12),
    timezone: clean(input.timezone, current.timezone).slice(0, 80),
    notifications: { ...current.notifications, ...(input.notifications || {}) },
    updatedAt: now(),
  };
  if (!["light", "dark", "system"].includes(next.theme)) throw new StorageValidationError("Invalid theme preference.");
  if (!["gold", "silver", "platinum", "copper"].includes(next.defaultMetal)) throw new StorageValidationError("Invalid default metal.");
  await requireRedis().set(collectionKey(userId, "settings"), JSON.stringify(next));
  return next;
}

export async function listWatchlist(userId: string) {
  return sortNewest(await readHash<WatchlistItem>(collectionKey(userId, "watchlist")));
}

export async function upsertWatchlist(userId: string, input: Partial<WatchlistItem>) {
  const symbol = clean(input.symbol).toUpperCase();
  const name = clean(input.name);
  if (!symbol || !name) throw new StorageValidationError("Watchlist symbol and name are required.");
  const assetKey = cleanLower(input.assetKey, symbol.toLowerCase());
  const current = await listWatchlist(userId);
  const existing = current.find((item) => item.assetKey === assetKey || item.symbol === symbol);
  if (!existing && current.length >= MAX_WATCHLIST_ITEMS) throw new StorageValidationError(`Watchlist limit is ${MAX_WATCHLIST_ITEMS} items.`);
  const timestamp = now();
  const item: WatchlistItem = {
    id: existing?.id || itemId(input.id || assetKey, "watch"),
    assetKey,
    symbol,
    name,
    assetType: (input.assetType || "other") as AssetType,
    route: clean(input.route) || undefined,
    market: clean(input.market) || undefined,
    addedAt: existing?.addedAt || timestamp,
    updatedAt: timestamp,
  };
  await writeHash(collectionKey(userId, "watchlist"), item.id, item);
  await recordActivity(userId, existing ? "watchlist.updated" : "watchlist.added", { assetKey });
  return item;
}

export async function removeWatchlist(userId: string, id: string) {
  const key = itemId(id, "watch");
  await requireRedis().hdel(collectionKey(userId, "watchlist"), key);
  await recordActivity(userId, "watchlist.removed", { id: key });
}

function normalizeSide(value: unknown): TransactionSide {
  if (["buy", "sell", "dividend", "deposit", "withdrawal", "fee"].includes(String(value))) return value as TransactionSide;
  throw new StorageValidationError("Invalid transaction type.");
}

export async function listTransactions(userId: string) {
  return sortNewest(await readHash<PortfolioTransaction>(collectionKey(userId, "transactions")));
}

export async function createTransaction(userId: string, input: Partial<PortfolioTransaction>) {
  const symbol = clean(input.symbol).toUpperCase();
  if (!symbol) throw new StorageValidationError("Transaction symbol is required.");
  const side = normalizeSide(input.side);
  const clientRequestId = clean(input.clientRequestId) || null;
  const r = requireRedis();
  if (clientRequestId) {
    const existingId = await r.hget<string>(collectionKey(userId, "transactions:idempotency"), clientRequestId);
    if (existingId) {
      const existing = parseJson<PortfolioTransaction>(await r.hget(collectionKey(userId, "transactions"), existingId));
      if (existing) return existing;
    }
  }
  const current = await listTransactions(userId);
  if (current.length >= MAX_TRANSACTIONS) throw new StorageValidationError(`Transaction limit is ${MAX_TRANSACTIONS} records.`);
  const quantity = positiveNumber(input.quantity, "Quantity");
  const price = positiveNumber(input.price, "Price");
  const fees = positiveNumber(input.fees ?? 0, "Fees", true);
  const transactionDate = clean(input.transactionDate, new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) throw new StorageValidationError("Transaction date must use YYYY-MM-DD.");
  const timestamp = now();
  const transaction: PortfolioTransaction = {
    id: itemId(input.id, "tx"),
    clientRequestId,
    assetKey: cleanLower(input.assetKey) || null,
    symbol,
    name: clean(input.name) || null,
    assetType: (input.assetType || "other") as AssetType,
    side,
    quantity,
    price,
    fees,
    currency: clean(input.currency, "INR").toUpperCase().slice(0, 8),
    transactionDate,
    notes: clean(input.notes).slice(0, 1000) || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await writeHash(collectionKey(userId, "transactions"), transaction.id, transaction);
  if (clientRequestId) await r.hset(collectionKey(userId, "transactions:idempotency"), { [clientRequestId]: transaction.id });
  await recordActivity(userId, "transaction.created", { id: transaction.id, symbol, side });
  return transaction;
}

export async function updateTransaction(userId: string, id: string, input: Partial<PortfolioTransaction>) {
  const r = requireRedis();
  const current = parseJson<PortfolioTransaction>(await r.hget(collectionKey(userId, "transactions"), id));
  if (!current) throw new StorageValidationError("Transaction not found.");
  const updated = await createTransaction(userId, { ...current, ...input, id: current.id, clientRequestId: null });
  await r.hdel(collectionKey(userId, "transactions"), current.id);
  await writeHash(collectionKey(userId, "transactions"), current.id, { ...updated, id: current.id, createdAt: current.createdAt });
  return { ...updated, id: current.id, createdAt: current.createdAt };
}

export async function removeTransaction(userId: string, id: string) {
  const r = requireRedis();
  const current = parseJson<PortfolioTransaction>(await r.hget(collectionKey(userId, "transactions"), id));
  await r.hdel(collectionKey(userId, "transactions"), id);
  if (current?.clientRequestId) await r.hdel(collectionKey(userId, "transactions:idempotency"), current.clientRequestId);
  await recordActivity(userId, "transaction.removed", { id });
}

export function calculatePortfolio(transactions: PortfolioTransaction[]): PortfolioSummary {
  const positions = new Map<string, PortfolioPosition>();
  let cashFlow = 0;
  let realizedProfitLoss = 0;
  for (const tx of transactions) {
    const key = tx.assetKey || tx.symbol.toLowerCase();
    const existing = positions.get(key) || { assetKey: key, symbol: tx.symbol, name: tx.name, assetType: tx.assetType, quantity: 0, costBasis: 0, averagePrice: 0, realizedProfitLoss: 0, currency: tx.currency };
    const gross = tx.quantity * tx.price;
    if (tx.side === "buy") {
      existing.quantity += tx.quantity;
      existing.costBasis += gross + tx.fees;
      cashFlow -= gross + tx.fees;
    } else if (tx.side === "sell") {
      const average = existing.quantity > 0 ? existing.costBasis / existing.quantity : 0;
      const proceeds = gross - tx.fees;
      existing.quantity = Math.max(0, existing.quantity - tx.quantity);
      existing.costBasis = Math.max(0, existing.costBasis - average * tx.quantity);
      existing.realizedProfitLoss += proceeds - average * tx.quantity;
      realizedProfitLoss += proceeds - average * tx.quantity;
      cashFlow += proceeds;
    } else if (tx.side === "dividend" || tx.side === "deposit") {
      cashFlow += gross - tx.fees;
    } else if (tx.side === "withdrawal" || tx.side === "fee") {
      cashFlow -= gross + tx.fees;
    }
    existing.averagePrice = existing.quantity > 0 ? existing.costBasis / existing.quantity : 0;
    positions.set(key, existing);
  }
  return { costBasis: [...positions.values()].reduce((sum, item) => sum + item.costBasis, 0), realizedProfitLoss, cashFlow, transactionCount: transactions.length, positions: [...positions.values()].filter((item) => item.quantity > 0 || item.costBasis > 0), updatedAt: now() };
}

export async function getPortfolioSummary(userId: string) {
  const summary = calculatePortfolio(await listTransactions(userId));
  await requireRedis().set(collectionKey(userId, "portfolio:summary"), JSON.stringify(summary));
  return summary;
}

function normalizeAsset(input: Partial<UserAlert>) {
  const assetKey = cleanLower(input.assetKey);
  const symbol = clean(input.symbol).toUpperCase();
  if (!assetKey || !symbol) throw new StorageValidationError("Alert asset key and symbol are required.");
  return { assetKey, symbol };
}

export async function listAlerts(userId: string) {
  return sortNewest(await readHash<UserAlert>(collectionKey(userId, "alerts")));
}

export async function createAlert(userId: string, input: Partial<UserAlert>) {
  const { assetKey, symbol } = normalizeAsset(input);
  const direction = input.direction;
  if (direction !== "above" && direction !== "below" && direction !== "movement") throw new StorageValidationError("Invalid alert direction.");
  const targetPrice = optionalPositiveNumber(input.targetPrice, "Target price");
  const movementPercent = optionalPositiveNumber(input.movementPercent, "Movement percentage");
  if (direction === "movement" ? movementPercent === null : targetPrice === null) throw new StorageValidationError(direction === "movement" ? "Movement percentage is required." : "Target price is required.");
  const current = await listAlerts(userId);
  if (current.length >= MAX_ALERTS) throw new StorageValidationError(`Alert limit is ${MAX_ALERTS} alerts.`);
  const timestamp = now();
  const alert: UserAlert = { id: itemId(input.id, "alert"), assetKey, symbol, name: clean(input.name) || null, assetType: (input.assetType || "other") as AssetType, direction, targetPrice: direction === "movement" ? null : targetPrice, movementPercent: direction === "movement" ? movementPercent : null, city: cleanLower(input.city, "mumbai"), currency: clean(input.currency, "INR").toUpperCase(), enabled: input.enabled !== false, lastTriggeredAt: null, lastConditionMet: false, lastProvider: null, lastQuoteAt: null, lastValue: null, createdAt: timestamp, updatedAt: timestamp };
  await writeHash(collectionKey(userId, "alerts"), alert.id, alert);
  await recordActivity(userId, "alert.created", { id: alert.id, assetKey });
  return alert;
}

export async function updateAlert(userId: string, id: string, input: Partial<UserAlert>) {
  const existing = parseJson<UserAlert>(await requireRedis().hget(collectionKey(userId, "alerts"), id));
  if (!existing) throw new StorageValidationError("Alert not found.");
  const direction = input.direction ?? existing.direction;
  if (direction !== "above" && direction !== "below" && direction !== "movement") throw new StorageValidationError("Invalid alert direction.");
  const targetPrice = direction === "movement" ? null : optionalPositiveNumber(input.targetPrice === undefined ? existing.targetPrice : input.targetPrice, "Target price");
  const movementPercent = direction === "movement" ? optionalPositiveNumber(input.movementPercent === undefined ? existing.movementPercent : input.movementPercent, "Movement percentage") : null;
  if (direction === "movement" ? movementPercent === null : targetPrice === null) throw new StorageValidationError(direction === "movement" ? "Movement percentage is required." : "Target price is required.");
  const updated = { ...existing, ...input, id: existing.id, direction, targetPrice, movementPercent, assetKey: cleanLower(input.assetKey, existing.assetKey), symbol: clean(input.symbol, existing.symbol).toUpperCase(), name: input.name === undefined ? existing.name : clean(input.name) || null, updatedAt: now() };
  await writeHash(collectionKey(userId, "alerts"), id, updated);
  return updated;
}

export async function markAlertTriggered(userId: string, id: string, triggeredAt = now()) {
  const r = requireRedis();
  const existing = parseJson<UserAlert>(await r.hget(collectionKey(userId, "alerts"), id));
  if (!existing) return null;
  const updated: UserAlert = { ...existing, lastTriggeredAt: triggeredAt, updatedAt: triggeredAt };
  await writeHash(collectionKey(userId, "alerts"), id, updated);
  return updated;
}

export async function updateAlertEvaluation(userId: string, id: string, input: { conditionMet: boolean; provider: string; quoteAt: string; value: number; triggeredAt?: number }) {
  const r = requireRedis();
  const existing = parseJson<UserAlert>(await r.hget(collectionKey(userId, "alerts"), id));
  if (!existing) return null;
  const updated: UserAlert = {
    ...existing,
    lastConditionMet: input.conditionMet,
    lastProvider: input.provider,
    lastQuoteAt: input.quoteAt,
    lastValue: input.value,
    lastTriggeredAt: input.triggeredAt ?? existing.lastTriggeredAt,
    updatedAt: now(),
  };
  await writeHash(collectionKey(userId, "alerts"), id, updated);
  return updated;
}

export async function removeAlert(userId: string, id: string) {
  await requireRedis().hdel(collectionKey(userId, "alerts"), id);
  await recordActivity(userId, "alert.removed", { id });
}

export async function listNotifications(userId: string) {
  return sortNewest(await readHash<UserNotification>(collectionKey(userId, "notifications"))).slice(0, MAX_NOTIFICATIONS);
}

export async function createNotification(userId: string, input: Omit<Partial<UserNotification>, "id" | "createdAt">) {
  const title = clean(input.title);
  const message = clean(input.message);
  if (!title || !message) throw new StorageValidationError("Notification title and message are required.");
  const notification: UserNotification = { id: `notification_${randomUUID()}`, type: input.type || "system", title: title.slice(0, 160), message: message.slice(0, 1000), url: clean(input.url) || null, assetKey: cleanLower(input.assetKey) || null, read: input.read === true, createdAt: now(), expiresAt: input.expiresAt || null, delivery: input.delivery || null };
  const items = await listNotifications(userId);
  if (items.length >= MAX_NOTIFICATIONS) {
    const oldest = items[items.length - 1];
    if (oldest) await requireRedis().hdel(collectionKey(userId, "notifications"), oldest.id);
  }
  await writeHash(collectionKey(userId, "notifications"), notification.id, notification);
  return notification;
}

export async function markNotificationRead(userId: string, id: string, read = true) {
  const r = requireRedis();
  const existing = parseJson<UserNotification>(await r.hget(collectionKey(userId, "notifications"), id));
  if (!existing) throw new StorageValidationError("Notification not found.");
  const updated = { ...existing, read };
  await writeHash(collectionKey(userId, "notifications"), id, updated);
  return updated;
}

export async function removeNotification(userId: string, id: string) {
  await requireRedis().hdel(collectionKey(userId, "notifications"), id);
}

export async function listPushSubscriptions(userId: string) {
  return readHash<PushSubscriptionRecord>(collectionKey(userId, "push-subscriptions"));
}

export function pushSubscriptionId(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex");
}

export async function savePushSubscription(userId: string, input: { endpoint: string; p256dh: string; auth: string; platform?: string }) {
  if (!input.endpoint.startsWith("https://") || !input.p256dh || !input.auth) throw new StorageValidationError("Invalid push subscription.");
  const id = pushSubscriptionId(input.endpoint);
  const existing = parseJson<PushSubscriptionRecord>(await requireRedis().hget(collectionKey(userId, "push-subscriptions"), id));
  const subscription: PushSubscriptionRecord = { id, endpoint: input.endpoint, p256dh: input.p256dh, auth: input.auth, platform: clean(input.platform) || null, createdAt: existing?.createdAt || now(), lastUsedAt: now() };
  await writeHash(collectionKey(userId, "push-subscriptions"), id, subscription);
  return subscription;
}

export async function removePushSubscription(userId: string, id: string) {
  await requireRedis().hdel(collectionKey(userId, "push-subscriptions"), id);
}

export async function recordActivity(userId: string, action: string, metadata: ActivityRecord["metadata"] = {}) {
  if (!redis) return;
  const record: ActivityRecord = { id: randomUUID(), action, metadata, createdAt: now() };
  const key = collectionKey(userId, "activity");
  await redis.lpush(key, JSON.stringify(record));
  await redis.ltrim(key, 0, MAX_ACTIVITY - 1);
}

export async function listActivity(userId: string) {
  const values = await requireRedis().lrange<string[]>(collectionKey(userId, "activity"), 0, MAX_ACTIVITY - 1);
  return values.map((value) => parseJson<ActivityRecord>(value)).filter((value): value is ActivityRecord => value !== null);
}

function calculationRecord(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new StorageValidationError(`${label} must be an object.`);
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean" && item !== null) {
      throw new StorageValidationError(`${label} contains an unsupported value.`);
    }
    if (typeof item === "number" && !Number.isFinite(item)) throw new StorageValidationError(`${label} contains an invalid number.`);
    result[key.slice(0, 80)] = typeof item === "string" ? item.slice(0, 500) : item;
  }
  return result;
}

export async function listCalculations(userId: string) {
  return sortNewest(await readHash<SavedCalculation>(collectionKey(userId, "calculations"))).slice(0, MAX_CALCULATIONS);
}

export async function createCalculation(userId: string, input: Record<string, unknown>) {
  const calculatorType = cleanLower(input.calculatorType).slice(0, 80);
  if (!calculatorType) throw new StorageValidationError("Calculator type is required.");
  const current = await listCalculations(userId);
  if (current.length >= MAX_CALCULATIONS) throw new StorageValidationError(`Calculation history limit is ${MAX_CALCULATIONS} records.`);
  const timestamp = now();
  const calculation: SavedCalculation = {
    id: itemId(input.id, "calc"),
    calculatorType,
    metal: cleanLower(input.metal) || null,
    inputs: calculationRecord(input.inputs, "Inputs"),
    result: calculationRecord(input.result, "Result"),
    currency: clean(input.currency, "INR").toUpperCase().slice(0, 8),
    city: cleanLower(input.city, "mumbai").slice(0, 80),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await writeHash(collectionKey(userId, "calculations"), calculation.id, calculation);
  await recordActivity(userId, "calculation.created", { id: calculation.id, calculatorType });
  return calculation;
}

export async function removeCalculation(userId: string, id: string) {
  await requireRedis().hdel(collectionKey(userId, "calculations"), itemId(id, "calc"));
  await recordActivity(userId, "calculation.removed", { id });
}

export async function listCalculatorPresets(userId: string) {
  return sortNewest(await readHash<CalculatorPreset>(collectionKey(userId, "calculator-presets"))).slice(0, MAX_CALCULATOR_PRESETS);
}

export async function createCalculatorPreset(userId: string, input: Record<string, unknown>) {
  const name = clean(input.name).slice(0, 80);
  const calculatorType = cleanLower(input.calculatorType).slice(0, 80);
  if (!name || !calculatorType) throw new StorageValidationError("Preset name and calculator type are required.");
  const current = await listCalculatorPresets(userId);
  if (current.length >= MAX_CALCULATOR_PRESETS) throw new StorageValidationError(`Preset limit is ${MAX_CALCULATOR_PRESETS} records.`);
  const timestamp = now();
  const preset: CalculatorPreset = { id: itemId(input.id, "preset"), name, calculatorType, inputs: calculationRecord(input.inputs, "Preset inputs"), createdAt: timestamp, updatedAt: timestamp };
  await writeHash(collectionKey(userId, "calculator-presets"), preset.id, preset);
  await recordActivity(userId, "calculator-preset.created", { id: preset.id, calculatorType });
  return preset;
}

export async function removeCalculatorPreset(userId: string, id: string) {
  await requireRedis().hdel(collectionKey(userId, "calculator-presets"), itemId(id, "preset"));
  await recordActivity(userId, "calculator-preset.removed", { id });
}

function defaultNewsPreferences(): NewsPreferences {
  return { metals: ["gold", "silver"], categories: ["metals", "markets"], country: "IN", language: "en", dailyDigest: false, breakingNews: true, updatedAt: now() };
}

export async function getNewsPreferences(userId: string) {
  const stored = parseJson<NewsPreferences>(await requireRedis().get(collectionKey(userId, "news-preferences")));
  return { ...defaultNewsPreferences(), ...(stored || {}) };
}

export async function updateNewsPreferences(userId: string, input: Record<string, unknown>) {
  const current = await getNewsPreferences(userId);
  const list = (value: unknown, fallback: string[]) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.toLowerCase().slice(0, 40)).slice(0, 20) : fallback;
  const next: NewsPreferences = {
    metals: list(input.metals, current.metals),
    categories: list(input.categories, current.categories),
    country: clean(input.country, current.country).toUpperCase().slice(0, 4),
    language: clean(input.language, current.language).toLowerCase().slice(0, 12),
    dailyDigest: typeof input.dailyDigest === "boolean" ? input.dailyDigest : current.dailyDigest,
    breakingNews: typeof input.breakingNews === "boolean" ? input.breakingNews : current.breakingNews,
    updatedAt: now(),
  };
  await requireRedis().set(collectionKey(userId, "news-preferences"), JSON.stringify(next));
  return next;
}

export async function listSavedNews(userId: string) {
  return sortNewest(await readHash<SavedNewsItem>(collectionKey(userId, "saved-news"))).slice(0, MAX_SAVED_NEWS);
}

export async function saveNews(userId: string, input: Record<string, unknown>) {
  const articleId = clean(input.articleId).slice(0, 160);
  const title = clean(input.title).slice(0, 300);
  const sourceUrl = clean(input.sourceUrl);
  if (!articleId || !title || !/^https?:\/\//i.test(sourceUrl)) throw new StorageValidationError("Article id, title and source URL are required.");
  const current = await listSavedNews(userId);
  const existing = current.find((item) => item.articleId === articleId);
  if (!existing && current.length >= MAX_SAVED_NEWS) throw new StorageValidationError(`Saved news limit is ${MAX_SAVED_NEWS} records.`);
  const saved: SavedNewsItem = { id: existing?.id || itemId(input.id || articleId, "news"), articleId, slug: clean(input.slug).slice(0, 120), title, source: clean(input.source, "News source").slice(0, 120), sourceUrl, imageUrl: /^https?:\/\//i.test(clean(input.imageUrl)) ? clean(input.imageUrl) : null, savedAt: existing?.savedAt || now() };
  await writeHash(collectionKey(userId, "saved-news"), saved.id, saved);
  await recordActivity(userId, existing ? "news-saved.updated" : "news-saved.created", { id: saved.id, articleId });
  return saved;
}

export async function removeSavedNews(userId: string, id: string) {
  await requireRedis().hdel(collectionKey(userId, "saved-news"), itemId(id, "news"));
  await recordActivity(userId, "news-saved.removed", { id });
}

export function normalizeEmail(value: unknown) {
  const email = cleanLower(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new StorageValidationError("Enter a valid email address.");
  return email;
}

export function normalizeUsername(value: unknown) {
  const username = cleanLower(value);
  if (!/^[a-z0-9_]{3,30}$/.test(username)) throw new StorageValidationError("Username must be 3-30 characters using letters, numbers, or underscores.");
  return username;
}

export async function hashPassword(password: string) {
  if (typeof password !== "string" || password.length < 8 || password.length > 128) throw new StorageValidationError("Password must be 8-128 characters.");
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [, salt, expectedHex] = encoded.split("$");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function emailLookup(email: string) {
  return `${STORAGE_VERSION}:lookup:email:${createHash("sha256").update(email).digest("hex")}`;
}

function usernameLookup(username: string) {
  return `${STORAGE_VERSION}:lookup:username:${username}`;
}

function sessionKey(tokenHash: string) {
  return `${STORAGE_VERSION}:session:${tokenHash}`;
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerAccount(input: { email: unknown; username: unknown; displayName?: unknown; password: string }) {
  const r = requireRedis();
  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);
  const existingEmail = await r.get<string>(emailLookup(email));
  if (existingEmail) throw new StorageValidationError("An account with this email already exists.");
  const existingUsername = await r.get<string>(usernameLookup(username));
  if (existingUsername) throw new StorageValidationError("That username is already taken.");
  const id = `usr_${randomUUID()}`;
  const timestamp = now();
  const profile: UserProfile = { id, email, username, displayName: clean(input.displayName, username).slice(0, 80), passwordHash: await hashPassword(input.password), status: "active", emailVerified: false, anonymous: false, createdAt: timestamp, updatedAt: timestamp };
  const emailClaim = await r.set(emailLookup(email), id, { nx: true });
  const usernameClaim = await r.set(usernameLookup(username), id, { nx: true });
  if (!emailClaim || !usernameClaim) {
    if (emailClaim) await r.del(emailLookup(email));
    if (usernameClaim) await r.del(usernameLookup(username));
    throw new StorageValidationError("Email or username is already registered.");
  }
  await saveProfile(profile);
  await r.set(collectionKey(id, "settings"), JSON.stringify(defaultSettings()));
  await r.sadd(ACCOUNT_INDEX_KEY, id);
  return profile;
}

export async function authenticateAccount(emailInput: unknown, password: string) {
  const email = normalizeEmail(emailInput);
  const id = await requireRedis().get<string>(emailLookup(email));
  if (!id) throw new StorageValidationError("Invalid email or password.");
  const profile = await getProfile(id);
  if (!profile || profile.status !== "active" || !profile.passwordHash || !(await verifyPassword(password, profile.passwordHash))) {
    throw new StorageValidationError("Invalid email or password.");
  }
  await requireRedis().sadd(ACCOUNT_INDEX_KEY, profile.id);
  return profile;
}

export async function listAccountIds() {
  if (!redis) return [];
  return (await redis.smembers<string[]>(ACCOUNT_INDEX_KEY)) || [];
}

export async function createSession(userId: string, metadata: { userAgent?: string; ipHash?: string } = {}) {
  const token = randomBytes(32).toString("base64url");
  const record = { userId, createdAt: now(), expiresAt: now() + SESSION_TTL_SECONDS * 1000, lastSeenAt: now(), userAgent: clean(metadata.userAgent).slice(0, 240), ipHash: clean(metadata.ipHash).slice(0, 128) };
  await requireRedis().set(sessionKey(tokenHash(token)), JSON.stringify(record), { ex: SESSION_TTL_SECONDS });
  return { token, ...record };
}

export async function getSession(token: string) {
  if (!token) return null;
  const record = parseJson<{ userId: string; expiresAt: number }>(await requireRedis().get(sessionKey(tokenHash(token))));
  if (!record || record.expiresAt < now()) return null;
  return record;
}

export async function deleteSession(token: string) {
  if (token) await requireRedis().del(sessionKey(tokenHash(token)));
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  const profile = await getProfile(session.userId);
  return profile && profile.status === "active" ? { session, profile } : null;
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: SESSION_TTL_SECONDS, path: "/" });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/" });
}

export async function clearAnonymousIdentityCookie() {
  (await cookies()).set(STORAGE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/" });
}

async function copyHash(sourceKey: string, targetKey: string, merge: (existing: unknown, incoming: unknown) => unknown = (_existing, incoming) => incoming) {
  const source = (await requireRedis().hgetall<Record<string, unknown>>(sourceKey)) || {};
  for (const [key, value] of Object.entries(source)) {
    const existing = await requireRedis().hget(targetKey, key);
    await requireRedis().hset(targetKey, { [key]: JSON.stringify(merge(parseJson(existing), parseJson(value))) });
  }
}

export async function migrateAnonymousData(anonymousId: string, accountId: string) {
  if (!anonymousId || anonymousId === accountId) return;
  for (const collection of ["watchlist", "alerts", "notifications", "push-subscriptions", "calculations", "calculator-presets", "saved-news"]) {
    await copyHash(collectionKey(anonymousId, collection), collectionKey(accountId, collection));
  }
  const transactions = await readHash<PortfolioTransaction>(collectionKey(anonymousId, "transactions"));
  const accountTransactions = await listTransactions(accountId);
  const existingRequestIds = new Set(accountTransactions.map((item) => item.clientRequestId).filter(Boolean));
  for (const transaction of transactions) {
    if (!transaction.clientRequestId || !existingRequestIds.has(transaction.clientRequestId)) await writeHash(collectionKey(accountId, "transactions"), transaction.id, transaction);
  }
  const anonymousSettings = parseJson<UserSettings>(await requireRedis().get(collectionKey(anonymousId, "settings")));
  if (anonymousSettings) await requireRedis().set(collectionKey(accountId, "settings"), JSON.stringify(anonymousSettings));
  await recordActivity(accountId, "anonymous-data.migrated", { anonymousId });
  await requireRedis().expire(`${STORAGE_VERSION}:profile:${anonymousId}`, 60 * 60 * 24 * 30);
  for (const collection of ["settings", "watchlist", "alerts", "notifications", "push-subscriptions", "transactions", "transactions:idempotency", "activity", "calculations", "calculator-presets", "saved-news", "news-preferences"]) {
    await requireRedis().expire(collectionKey(anonymousId, collection), 60 * 60 * 24 * 30);
  }
}

export async function getStorageSnapshot(userId: string) {
  const [profile, settings, watchlist, transactions, alerts, notifications, calculations, calculatorPresets, savedNews, newsPreferences, summary] = await Promise.all([
    getProfile(userId),
    getUserSettings(userId),
    listWatchlist(userId),
    listTransactions(userId),
    listAlerts(userId),
    listNotifications(userId),
    listCalculations(userId),
    listCalculatorPresets(userId),
    listSavedNews(userId),
    getNewsPreferences(userId),
    getPortfolioSummary(userId),
  ]);
  const safeProfile = profile
    ? {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        displayName: profile.displayName,
        status: profile.status,
        emailVerified: profile.emailVerified,
        anonymous: profile.anonymous,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }
    : null;
  return { profile: safeProfile, settings, watchlist, transactions, alerts, notifications, calculations, calculatorPresets, savedNews, newsPreferences, portfolio: summary };
}

export function requestIpHash(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

export async function withinAuthRateLimit(request: Request, scope: "register" | "login") {
  const r = requireRedis();
  const key = `${STORAGE_VERSION}:rate-limit:auth:${scope}:${requestIpHash(request)}`;
  const count = await r.incr(key);
  if (count === 1) await r.expire(key, 15 * 60);
  return count <= (scope === "login" ? 10 : 5);
}
