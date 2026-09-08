import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = process.env.TEST_ORIGIN || "http://localhost:3005";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw Error("Local origin required");
const browser = await chromium.launch({ headless: true, chromiumSandbox: true, channel: process.env.TEST_BROWSER_CHANNEL || "msedge" });
const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 844 } });
let account = "test_A";
const accounts = new Map([["test_A", []], ["test_B", []]]);
const presets = new Map([["test_A", []], ["test_B", []]]);
const evidence = { mode: "Isolated browser fixtures. Actual server ownership tested separately by market-updates.test.mjs. No external writes or messages.", checks: [], failures: [] };
await context.addInitScript(() => { for (const id of ["test_A","test_B"]) localStorage.setItem("gsp-market-consent-v3:" + id + ":due", String(Date.now() + 86400000)); });
await context.route("**/*", route => {
  const req = route.request(), url = new URL(req.url());
  if (url.origin !== origin) return route.abort();
  const reply = (data, status = 200) => route.fulfill({ status, json: { ok: status === 200, data } });
  if (url.pathname === "/api/auth/me") return reply({ user: { id: account, displayName: account, emailVerified: false } });
  if (url.pathname === "/api/storage/watchlist") {
    if (req.method() === "POST") accounts.get(account).push({ ...req.postDataJSON(), id: "test-watch-" + account });
    if (req.method() === "DELETE") accounts.set(account, accounts.get(account).filter(x => x.id !== url.searchParams.get("id")));
    return reply(accounts.get(account));
  }
  if (url.pathname === "/api/storage/calculator-presets") {
    if (req.method() === "POST") presets.get(account).push({ ...req.postDataJSON(), id: "test-preset-" + account });
    return reply(presets.get(account));
  }
  if (url.pathname.startsWith("/api/storage/calculator-presets/")) { presets.set(account, []); return reply({ deleted: true }); }
  if (url.pathname === "/api/storage/settings") return reply({ notifications: { marketUpdates: false, emailAlerts: false, browserPush: false } });
  if (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/metals/")) return reply(null, 401);
  if (req.method() !== "GET") return route.abort();
  return route.continue();
});
const page = await context.newPage();
try {
  await page.goto(origin + "/gold-price-today", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Watch Gold", exact: true }).click();
  await page.getByRole("button", { name: "Remove Gold", exact: true }).waitFor();
  assert.equal(accounts.get("test_A").length, 1);
  await page.getByRole("button", { name: "Remove Gold", exact: true }).click();
  await page.getByRole("button", { name: "Watch Gold", exact: true }).waitFor();
  assert.equal(accounts.get("test_A").length, 0);
  evidence.checks.push("Watch/remove reflects immediately without reload.");
  await page.goto(origin + "/calculators/copper", { waitUntil: "networkidle" });
  await page.locator('input[name="rate"]').fill("100");
  await page.locator('input[name="weight"]').fill("2");
  await page.getByRole("button", { name: "Save estimate", exact: true }).click();
  await page.locator(".metals-saved li").waitFor();
  account = "test_B";
  await page.evaluate(() => window.dispatchEvent(new StorageEvent("storage", { key: "gsp-account-data-v2", newValue: "test-account-switch" })));
  await page.waitForFunction(() => !document.querySelector(".metals-saved li"));
  assert.equal(presets.get("test_A").length, 1);
  account = "test_A";
  await page.evaluate(() => window.dispatchEvent(new StorageEvent("storage", { key: "gsp-account-data-v2", newValue: "test-account-return" })));
  await page.locator(".metals-saved li").waitFor();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector(".metals-saved li"));
  evidence.checks.push("Account save/delete and cache invalidation on A/B switch passed without reload.");
  await page.goto(origin + "/gold-price-today");
  const table = page.locator(".metals-table").first();
  assert.equal(await table.evaluate(el => el.scrollWidth > el.clientWidth), true);
  await table.focus(); await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => document.querySelector(".metals-table").scrollLeft > 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), true);
  evidence.checks.push("Metal table scrolls with keyboard inside its container; document stays within viewport.");
} catch (error) { evidence.failures.push(String(error)); }
finally { await browser.close(); await mkdir("test-results/metals", { recursive: true }); await writeFile("test-results/metals/interactions.json", JSON.stringify(evidence, null, 2)); }
console.log(JSON.stringify(evidence)); if (evidence.failures.length) process.exitCode = 1;
