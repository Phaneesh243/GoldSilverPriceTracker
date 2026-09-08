import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { runInNewContext } from "node:vm";

// Deliberately isolated: no .env files, Redis connections, emails or pushes.
const values = new Map();
const hashes = new Map();
const sets = new Map();
const cookieJar = new Map();
const decode = (value) => { try { return JSON.parse(value); } catch { return value ?? null; } };
const hash = (key) => { if (!hashes.has(key)) hashes.set(key, new Map()); return hashes.get(key); };
const redis = {
  get: async (key) => decode(values.get(key)),
  set: async (key, value, options = {}) => { if (options.nx && values.has(key)) return null; values.set(key, value); return "OK"; },
  exists: async (key) => Number(values.has(key) || hashes.has(key)),
  del: async (key) => { values.delete(key); hashes.delete(key); return 1; },
  expire: async () => 1,
  incr: async (key) => { const value = Number(values.get(key) || 0) + 1; values.set(key, value); return value; },
  hset: async (key, fields) => { for (const [field, value] of Object.entries(fields)) hash(key).set(field, value); return 1; },
  hsetnx: async (key, field, value) => { if (hash(key).has(field)) return 0; hash(key).set(field, value); return 1; },
  hexists: async (key, field) => Number(hash(key).has(field)),
  hget: async (key, field) => decode(hash(key).get(field)),
  hgetall: async (key) => Object.fromEntries([...hash(key)].map(([field, value]) => [field, decode(value)])),
  hdel: async (key, field) => Number(hash(key).delete(field)),
  sadd: async (key, value) => { if (!sets.has(key)) sets.set(key, new Set()); sets.get(key).add(value); return 1; },
  smembers: async (key) => [...sets.get(key) || []],
  lpush: async () => 1, ltrim: async () => "OK",
  eval: async (script, keys, args) => {
    if (script.includes("HSETNX")) {
      if (await redis.hget(keys[1], "inApp") === "sent") return 0;
      await redis.hsetnx(keys[0], args[0], args[1]);
      await redis.hset(keys[1], { inApp: "sent" }); return 1;
    }
    if (script.includes("local old")) {
      const old = await redis.get(keys[0]);
      if (old && old !== args[0]) await redis.hdel(args[3] + old + ":push-subscriptions", args[1]);
      await redis.set(keys[0], args[0]); await redis.hset(keys[1], { [args[1]]: args[2] }); return 1;
    }
    if (script.includes("HEXISTS")) {
      if (!hash(keys[0]).has(args[0]) && hash(keys[0]).size >= args[2]) return 0;
      await redis.hset(keys[0], { [args[0]]: args[1] }); return 1;
    }
    if (script.includes("KEYS[3]")) {
      if (await redis.exists(keys[2])) return 1;
      if (Number(await redis.get(keys[0])) >= args[0] || Number(await redis.get(keys[1])) >= args[1]) return 0;
      await redis.incr(keys[0]); await redis.incr(keys[1]); await redis.set(keys[2], "1"); return 1;
    }
    if (await redis.get(keys[0]) === args[0]) return redis.del(keys[0]);
    return 0;
  },
};
const state = { redis, cookieJar, jobs: [], pushes: [], emails: [], failEmail: false, failPush: false, providerFailure: true };
globalThis.__gspTest = state;
globalThis.fetch = async (url, options) => {
  if (String(url) === "https://api.resend.com/emails") {
    if (state.failEmail) return new Response("", { status: 503 });
    state.emails.push(JSON.parse(options.body)); return Response.json({ id: "test-only-email-id" });
  }
  throw new Error("Unexpected network request blocked by test: " + url);
};
const mocks = {
  "server-only": "export {};",
  "next/headers": "export async function cookies() { return { get: (key) => { const value = globalThis.__gspTest.cookieJar.get(key); return value ? { value } : undefined; }, set: (key, value) => globalThis.__gspTest.cookieJar.set(key, value) }; }",
  "next/server": "export const NextResponse = Response;",
  "@upstash/qstash": `export class Receiver { async verify() { throw Error("Invalid signature"); } } export class Client { async publishJSON(job) { globalThis.__gspTest.jobs.push(job); return { messageId: "test" }; } }`,
  "web-push": `export default { setVapidDetails() {}, async sendNotification(subscription, payload) { if (globalThis.__gspTest.failPush) throw Error("Test push failure"); globalThis.__gspTest.pushes.push({ subscription, payload: JSON.parse(payload) }); } };`,
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier in mocks) return { url: "gsp-test:" + specifier, shortCircuit: true };
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const target = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(target) + ".ts")) return { url: target.href + ".ts", shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("gsp-test:")) return { format: "module", source: mocks[url.slice(9)], shortCircuit: true };
    if (url.endsWith("/lib/redis.ts")) return { format: "module", source: "export const redis = globalThis.__gspTest.redis;", shortCircuit: true };
    const providers = { "/lib/metal-prices.ts": ["getAllMetalPrices", "{ metals: [] }"], "/lib/stock-quotes.ts": ["fetchLiveStockQuotes", "[]"], "/lib/crypto-market-provider.ts": ["fetchCryptoMarkets", "[]"], "/lib/currency-prices.ts": ["getCurrencyRates", "[]"] };
    for (const [suffix, [name, result]] of Object.entries(providers)) if (url.endsWith(suffix)) return { format: "module", source: `export async function ${name}() { if (globalThis.__gspTest.providerFailure) throw Error("Provider unavailable in test"); return ${result}; }`, shortCircuit: true };
    if (url.endsWith(".ts")) return { format: "module", source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText, shortCircuit: true };
    return next(url, context);
  },
});
const storage = await import("../lib/storage.ts");
const optIn = await import("../lib/notification-opt-in.ts");
const themeControls = await import("../app/_hooks/useTheme.ts");
test("theme bootstrap consistently restores light/dark and defaults to dark with blocked storage", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const script = layout.match(/const themeScript = `([\s\S]*?)`;/)[1];
  for (const saved of [null, "invalid", "dark", "light", "blocked"]) {
    const document = { documentElement: { dataset: {} } };
    runInNewContext(script, { document, window: { localStorage: { getItem: () => { if (saved === "blocked") throw Error("Blocked"); return saved; } } } });
    assert.equal(document.documentElement.dataset.theme, saved === "light" ? "light" : "dark");
  }
});
test("theme controls use the document as the single source and still switch when persistence fails", () => {
  const doc = Object.getOwnPropertyDescriptor(globalThis, "document");
  const local = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  try {
    Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: { dataset: { theme: "dark" } } } });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { setItem: () => { throw Error("Blocked"); } } });
    themeControls.setTheme("light"); assert.equal(themeControls.getTheme(), "light");
    themeControls.setTheme("dark"); assert.equal(themeControls.getTheme(), "dark");
  } finally {
    if (doc) Object.defineProperty(globalThis, "document", doc); else delete globalThis.document;
    if (local) Object.defineProperty(globalThis, "localStorage", local); else delete globalThis.localStorage;
  }
});
function consentPorts(permission = "granted") {
  const calls = [];
  return { calls, ports: {
    permission: async () => { calls.push("permission"); return permission; },
    subscribeBrowser: async () => { calls.push("browser"); },
    save: async (preferences) => { calls.push(preferences); },
    verifyEmail: async () => { calls.push("verify-email"); },
    onSaved: () => { calls.push("close-popup"); },
  } };
}
test("browser Allow never opts a verified email into a separate channel", async () => {
  const { calls, ports } = consentPorts();
  const pending = optIn.allowMarketUpdates(true, ports);
  assert.deepEqual(calls, ["permission"], "native permission must start synchronously in the click");
  assert.equal((await pending).accepted, true);
  assert.deepEqual(calls, ["permission", "browser", { marketUpdates: true, browserPush: true }, "close-popup"]);
});
test("unverified email requires an explicit separate request", async () => {
  const { calls, ports } = consentPorts();
  const result = await optIn.allowMarketUpdates(false, ports);
  assert.equal(result.accepted, true);
  assert.deepEqual(calls, ["permission", "browser", { marketUpdates: true, browserPush: true }, "close-popup"]);
  assert.match(result.message, /separate choice/);
});
test("dismissing native permission saves nothing and may be invited again", async () => {
  const { calls, ports } = consentPorts("default");
  assert.equal((await optIn.allowMarketUpdates(true, ports)).accepted, false);
  assert.deepEqual(calls, ["permission"]);
});
test("blocked and unsupported push never register a browser but retain consent for eligible channels", async () => {
  for (const permission of ["denied", "unsupported"]) {
    const { calls, ports } = consentPorts(permission);
    assert.equal((await optIn.allowMarketUpdates(true, ports)).accepted, true);
    assert.deepEqual(calls, ["permission", { marketUpdates: true }, "close-popup"]);
  }
});
test("failed push setup does not falsely mark browser enabled; verification failure is recoverable", async () => {
  const { calls, ports } = consentPorts();
  ports.subscribeBrowser = async () => { throw Error("Unavailable"); };
  ports.verifyEmail = async () => { throw Error("Quota"); };
  const result = await optIn.allowMarketUpdates(false, ports);
  assert.equal(result.accepted, true);
  assert.deepEqual(calls, ["permission", { marketUpdates: true }, "close-popup"]);
  assert.match(result.message, /Retry browser/);
  assert.match(result.message, /separate choice/);
});
test("failed preference save never closes popup or starts verification", async () => {
  const { calls, ports } = consentPorts();
  ports.save = async () => { throw Error("Save failed"); };
  await assert.rejects(optIn.allowMarketUpdates(false, ports), /Save failed/);
  assert.deepEqual(calls, ["permission", "browser"]);
});
test("seven-day dismissal cooldown is gated by visibility and consent", () => {
  const due = 1000 + optIn.INVITATION_DELAY_MS;
  assert.equal(due, 604801000);
  assert.equal(optIn.invitationEligible(false, false, true, due, due - 1), false);
  assert.equal(optIn.invitationEligible(false, false, true, due, due), true);
  assert.equal(optIn.invitationEligible(false, false, false, due, 90000), false);
  assert.equal(optIn.invitationEligible(true, false, true, due, 90000), false);
  assert.equal(optIn.invitationEligible(false, true, true, due, 90000), false);
});
const schedule = await import("../lib/market-schedule.ts");
const email = await import("../lib/notification-email.ts");
const digest = await import("../lib/market-digest.ts");
const watchlist = await import("../app/api/storage/watchlist/route.ts");
const presetsApi = await import("../app/api/storage/calculator-presets/route.ts");
const presetsDelete = await import("../app/api/storage/calculator-presets/[id]/route.ts");
const jobRoute = await import("../app/api/jobs/market-updates/route.ts");
const actualDate = Date;
const fixedTime = new actualDate("2026-09-07T03:47:00Z").getTime();
beforeEach(() => {
  values.clear(); hashes.clear(); sets.clear(); cookieJar.clear();
  state.jobs.length = 0; state.pushes.length = 0; state.emails.length = 0; state.failEmail = false; state.failPush = false;
  process.env.NEXT_PUBLIC_SITE_URL = "https://test.example";
  process.env.NOTIFICATION_SIGNING_SECRET = "test-only-secret-with-at-least-32-characters";
  process.env.RESEND_API_KEY = "test-only"; process.env.RESEND_FROM_EMAIL = "test@test.example";
  process.env.MARKET_UPDATES_ENABLED = "true";
  process.env.QSTASH_TOKEN = "test-only"; process.env.QSTASH_CURRENT_SIGNING_KEY = "test-only"; process.env.QSTASH_NEXT_SIGNING_KEY = "test-only";
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-only"; process.env.VAPID_PRIVATE_KEY = "test-only"; process.env.VAPID_EMAIL = "test@test.example";
  process.env.RESEND_DAILY_LIMIT = "90"; process.env.RESEND_MONTHLY_LIMIT = "2900";
  globalThis.Date = class extends actualDate { constructor(...args) { super(...(args.length ? args : [fixedTime])); } static now() { return fixedTime; } };
});
async function account(id = "usr_account_a", subscribed = true) {
  await storage.ensureStorageUser(id, false);
  const profile = await storage.getProfile(id);
  await redis.set("gsp:v1:profile:" + id, { ...profile, email: id + "@test.example", emailVerified: true });
  if (subscribed) await storage.updateUserSettings(id, { notifications: { marketUpdates: true, emailAlerts: true, browserPush: true } });
  const session = await storage.createSession(id, {});
  cookieJar.set(storage.SESSION_COOKIE, session.token);
  return session;
}
async function seedEdition(userId = "usr_account_a") {
  await redis.set("gsp:v2:edition:2026-09-07:open", { id: "2026-09-07:open", date: "2026-09-07", edition: "open", title: "Test edition", message: "All providers unavailable. No numeric market data.", generatedAt: fixedTime, expiresAt: fixedTime + 3600_000, recipients: [userId] });
}
const asset = { assetKey: "stock:reliance", symbol: "RELIANCE", name: "Reliance Industries", assetType: "stock", market: "NSE", route: "/stocks/reliance" };
test("metal calculator presets validate server-side and remain isolated between accounts", async () => {
  assert.equal((await presetsApi.GET()).status, 401);
  await account("usr_account_a");
  const valid = { name: "Test estimate", calculatorType: "copper", inputs: { rate: "100", weight: "2", fixed: "0", tax: "0" } };
  const response = await presetsApi.POST(new Request("http://local/api/storage/calculator-presets", { method: "POST", body: JSON.stringify(valid) }));
  assert.equal(response.status, 201);
  const id = (await response.json()).data.id;
  assert.equal((await presetsApi.POST(new Request("http://local/api/storage/calculator-presets", { method: "POST", body: JSON.stringify({ ...valid, inputs: { rate: "-1" } }) }))).status, 400);
  await account("usr_account_b");
  assert.deepEqual((await (await presetsApi.GET()).json()).data, []);
  await presetsDelete.DELETE(new Request("http://local"), { params: Promise.resolve({ id }) });
  assert.equal((await storage.listCalculatorPresets("usr_account_a")).length, 1);
  await account("usr_account_a");
  await presetsDelete.DELETE(new Request("http://local"), { params: Promise.resolve({ id }) });
  assert.deepEqual((await (await presetsApi.GET()).json()).data, []);
});
test("exactly two schedules with correct UTC conversion", () => {
  assert.deepEqual(schedule.MARKET_SCHEDULES.map((item) => item.cron), ["45 3 * * 1-5", "0 10 * * 1-5"]);
  assert.equal(schedule.editionWindow("open", "2026-09-07", fixedTime).allowed, true);
  assert.equal(schedule.editionWindow("close", "2026-09-07", fixedTime).allowed, false);
});
test("holidays, weekends, invalid dates and unknown years fail closed", () => {
  for (const date of ["2026-01-15", "2026-09-14", "2026-11-08", "2026-09-06", "2027-01-04", "2026-02-31"]) assert.equal(schedule.regularTradingDay(date).eligible, false, date);
});
test("missing, invalid, future or stale quote timestamps are never called live", () => {
  assert.equal(schedule.quoteAvailability(null, null, 60000), "unavailable");
  assert.equal(schedule.quoteAvailability(1, null, 60000), "timestamp-unavailable");
  assert.equal(schedule.quoteAvailability(1, "2026-09-08T00:00:00Z", 60000), "timestamp-unavailable");
  assert.equal(schedule.quoteAvailability(1, "2026-09-06T00:00:00Z", 60000), "older-reference");
});
test("anonymous and forged registered-id cookies cannot access watchlists", async () => {
  await account();
  cookieJar.delete(storage.SESSION_COOKIE);
  cookieJar.set(storage.STORAGE_COOKIE, "usr_account_a");
  assert.equal((await watchlist.GET()).status, 401);
  assert.equal((await storage.getOrCreateStorageUser()).anonymous, true);
  await assert.rejects(storage.ensureStorageUser("usr_account_a", true), /Invalid anonymous/);
});
test("watchlists remain scoped, notes editable, duplicates prevented, exchanges distinct", async () => {
  await account();
  const saved = await storage.upsertWatchlist("usr_account_a", asset);
  await storage.upsertWatchlist("usr_account_a", asset);
  assert.equal((await storage.listWatchlist("usr_account_a")).length, 1);
  await storage.upsertWatchlist("usr_account_a", { ...asset, market: "BSE" });
  assert.equal((await storage.listWatchlist("usr_account_a")).length, 2);
  await storage.upsertWatchlist("usr_account_a", { ...saved, notes: "Personal test note" });
  await account("usr_account_b");
  assert.deepEqual(await storage.listWatchlist("usr_account_b"), []);
  await assert.rejects(storage.upsertWatchlist("usr_account_b", { ...saved, notes: "Attempted edit" }), /not found/);
  await storage.removeWatchlist("usr_account_b", saved.id);
  assert.equal((await storage.listWatchlist("usr_account_a")).length, 2);
});
test("saving an asset does not subscribe; legacy rule preferences rejected", async () => {
  await account("usr_account_a", false);
  await storage.upsertWatchlist("usr_account_a", asset);
  assert.equal((await storage.getUserSettings("usr_account_a")).notifications.marketUpdates, false);
  await assert.rejects(storage.updateUserSettings("usr_account_a", { notifications: { targetPrice: 100 } }), /Only fixed/);
  await assert.rejects(storage.updateUserSettings("usr_account_a", { notifications: { marketUpdates: "true" } }), /Only fixed/);
});
test("internal routes reject unsafe URLs", async () => {
  await account();
  for (const route of ["javascript:alert(1)", "//evil.example", "/\\evil.example"]) await assert.rejects(storage.upsertWatchlist("usr_account_a", { ...asset, route }), /Invalid detail/);
});
test("browser subscription has one account owner and expires with its session", async () => {
  await account();
  const input = { endpoint: "https://fcm.googleapis.com/test-endpoint", p256dh: "test", auth: "test" };
  const first = await storage.savePushSubscription("usr_account_a", input);
  const sessionB = await account("usr_account_b");
  const second = await storage.savePushSubscription("usr_account_b", input);
  assert.equal(await storage.isPushSubscriptionActive("usr_account_a", first), false);
  assert.equal(await storage.isPushSubscriptionActive("usr_account_b", second), true);
  assert.deepEqual(await storage.listPushSubscriptions("usr_account_a"), []);
  await storage.deleteSession(sessionB.token);
  assert.equal(await storage.isPushSubscriptionActive("usr_account_b", second), false);
});
test("email failure does not block in-app and retry does not duplicate history", async () => {
  await account(); await seedEdition(); state.failEmail = true;
  await assert.rejects(digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a"), /retry/);
  const notifications = await storage.listNotifications("usr_account_a");
  assert.equal(notifications.length, 1);
  state.failEmail = false;
  await digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a");
  await digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a");
  assert.equal((await storage.listNotifications("usr_account_a")).length, 1);
  assert.equal(state.emails.length, 1);
  await storage.removeNotification("usr_account_a", notifications[0].id);
  await digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a");
  assert.equal((await storage.listNotifications("usr_account_a")).length, 0);
});
test("retries do not resend successful push devices when email fails", async () => {
  await account(); await seedEdition();
  await storage.savePushSubscription("usr_account_a", { endpoint: "https://fcm.googleapis.com/test-endpoint", p256dh: "test", auth: "test" });
  state.failEmail = true;
  await assert.rejects(digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a"));
  state.failEmail = false;
  await digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a");
  assert.equal(state.pushes.length, 1);
  assert.equal(state.emails.length, 1);
});
test("unsubscribe invalidates queued delivery; forged unsubscribe rejected", async () => {
  await account(); await seedEdition();
  const url = email.unsubscribeUrl("usr_account_a");
  await assert.rejects(email.unsubscribeEmail(new URL(url).searchParams.get("token") + "bad"));
  await email.unsubscribeEmail(new URL(url).searchParams.get("token"));
  await digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a");
  assert.equal(state.emails.length, 0);
  assert.equal((await storage.listNotifications("usr_account_a")).length, 1);
  await storage.updateUserSettings("usr_account_a", { notifications: { marketUpdates: false } });
  assert.deepEqual(await digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a"), { skipped: "unsubscribed" });
});
test("email daily quota is bounded and idempotent", async () => {
  process.env.RESEND_DAILY_LIMIT = "1";
  assert.equal(await email.reserveEmailQuota("first"), true);
  assert.equal(await email.reserveEmailQuota("first"), true);
  assert.equal(await email.reserveEmailQuota("second"), false);
});
test("all-provider outage produces explicit unavailable edition, duplicate dispatch is resumable", async () => {
  await account();
  await digest.dispatchMarketEdition("open", "2026-09-07");
  const snapshot = await redis.get("gsp:v2:edition:2026-09-07:open");
  assert.match(snapshot.message, /unavailable/);
  assert.doesNotMatch(snapshot.message, /₹/);
  await digest.dispatchMarketEdition("open", "2026-09-07");
  const count = state.jobs.length;
  await digest.dispatchMarketEdition("open", "2026-09-07");
  assert.equal(state.jobs.length, count);
});
test("unsigned scheduler request cannot send messages", async () => {
  const response = await jobRoute.POST(new Request("https://test.example/api/jobs/market-updates", { method: "POST", body: '{"edition":"open"}' }));
  assert.equal(response.status, 401);
  assert.equal(state.emails.length, 0);
  assert.equal(state.jobs.length, 0);
});
test("retired endpoints never call delivery code", async () => {
  for (const path of ["alerts/check", "alerts/evaluate", "alerts/subscribe", "storage/alerts", "cron/big-move", "cron/check-user-alerts", "cron/send-price-updates"]) {
    const endpoint = await import(pathToFileURL(fileURLToPath(new URL(`../app/api/${path}/route.ts`, import.meta.url))).href);
    assert.equal(endpoint.GET().status, 410, path);
    assert.equal(endpoint.POST().status, 410, path);
  }
  assert.equal(state.emails.length, 0);
  assert.equal(state.pushes.length, 0);
});
test("unverified emails cannot opt in; confirmation is account bound", async () => {
  await account();
  const profile = await storage.getProfile("usr_account_a");
  await redis.set("gsp:v1:profile:usr_account_a", { ...profile, emailVerified: false });
  await assert.rejects(storage.updateUserSettings("usr_account_a", { notifications: { emailAlerts: true } }), /Verify/);
  await email.requestEmailVerification("usr_account_a");
  const url = state.emails[0].text.match(/https:\/\/[^\s]+/)[0];
  const token = new URL(url).searchParams.get("token");
  await account("usr_account_b");
  await assert.rejects(email.confirmEmailVerification("usr_account_b", token), /matching account/);
  await email.confirmEmailVerification("usr_account_a", token);
  assert.equal((await storage.getProfile("usr_account_a")).emailVerified, true);
  await assert.rejects(email.confirmEmailVerification("usr_account_a", token), /fresh verification/);
});
test("concurrent digest calls are locked and expired editions never send", async () => {
  await account(); await seedEdition();
  const outcomes = await Promise.allSettled([digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a"), digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a")]);
  assert.equal(outcomes.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(state.emails.length, 1);
  const snapshot = await redis.get("gsp:v2:edition:2026-09-07:open");
  await redis.set("gsp:v2:edition:2026-09-07:open", { ...snapshot, expiresAt: fixedTime - 1 });
  assert.deepEqual(await digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a"), { skipped: "expired-or-missing-edition" });
});
test("email quota exhaustion preserves in-app delivery", async () => {
  await account(); await seedEdition(); process.env.RESEND_DAILY_LIMIT = "1";
  await email.reserveEmailQuota("another-email");
  await digest.deliverMarketEdition("open", "2026-09-07", "usr_account_a");
  assert.equal(state.emails.length, 0);
  assert.equal((await storage.listNotifications("usr_account_a")).length, 1);
  assert.equal(await redis.hget("gsp:v2:edition:2026-09-07:open:usr_account_a:delivery", "email"), "quota-skipped");
});
