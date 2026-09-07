import assert from "node:assert/strict";
const base = new URL(process.argv[2] || "http://localhost:3001");
if (!["localhost", "127.0.0.1"].includes(base.hostname)) throw new Error("This smoke test is restricted to the local application.");
const checks = [
  ["/notifications", "GET", 200], ["/watchlist", "GET", 200],
  ["/stocks/reliance", "GET", 200], ["/stocks/tcs", "GET", 200],
  ["/metals", "GET", 200], ["/crypto", "GET", 200], ["/currencies", "GET", 200],
  ["/alerts", "GET", 307],
  ["/api/storage/watchlist", "GET", 401],
  ["/api/storage/notifications", "GET", 401],
  ["/api/storage/settings", "GET", 401],
  ["/api/storage/push-subscriptions", "GET", 401],
  ["/api/alerts/subscribe", "POST", 410],
  ["/api/storage/alerts", "POST", 410],
  ["/api/cron/check-user-alerts", "GET", 410],
  ["/api/cron/send-price-updates?slot=morning", "GET", 410],
  ["/api/cron/big-move", "GET", 410],
];
for (const [path, method, expected] of checks) {
  const response = await fetch(new URL(path, base), { method, redirect: "manual", signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, expected, path);
  if (path === "/alerts") assert.equal(response.headers.get("location"), "/notifications");
  if (expected === 401) assert.match(response.headers.get("cache-control") || "", /no-store/);
  console.log(method, path, response.status);
}
console.log("All local route checks passed. No cookies, account writes or messages were sent.");
