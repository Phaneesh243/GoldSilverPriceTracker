import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = process.env.TEST_ORIGIN || "http://localhost:3004";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw new Error("Local test origin required.");
const output = "test-results/metals";
await mkdir(output, { recursive: true });
const metals = ["gold", "silver", "platinum", "copper"];
const tools = ["gold", "silver", "platinum", "copper", "gold-jewellery", "making-charge-comparison", "budget-to-gold", "weight-converter", "purity-converter", "invoice-checker", "old-gold-exchange", "investment-return", "wedding-budget"];
const guides = ["hallmarking", "price-basis", "invoice", "coins-bars-jewellery", "exchange", "drivers", "wedding", "methodology"];
const routes = ["/metals", "/metals/calculators", "/metals/learn", "/metal-comparison", ...metals.flatMap(m => [`/${m}-price-today`, `/${m}-price-last-10-days`]), ...tools.map(t => "/calculators/" + t), ...guides.map(g => "/metals/learn/" + g), "/gold-price/mumbai", "/gold-price/delhi", "/historical-prices"];
const sizes = [[320,568],[375,667],[390,844],[430,932],[768,1024],[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080]];
const report = { origin, date: new Date().toISOString(), mode: "Production build; current provider references enabled, ads disabled. Browser account endpoints isolated; no emails or external writes.", zoom: "Actual browser zoom not automated or claimed; viewport tests are not zoom tests.", checks: [], screenshots: [], failures: [] };
const browser = await chromium.launch({ headless: true, chromiumSandbox: true, ...(process.env.TEST_BROWSER_CHANNEL ? { channel: process.env.TEST_BROWSER_CHANNEL } : {}) });
const context = await browser.newContext({ serviceWorkers: "block" });
await context.route("**/*", async route => {
  const url = new URL(route.request().url());
  if (url.origin !== origin) return route.abort();
  if (url.pathname === "/api/auth/me") return route.fulfill({ json: { ok: true, data: { user: null } } });
  if (url.pathname.startsWith("/api/storage/") || url.pathname.startsWith("/api/notifications/")) return route.fulfill({ status: 401, json: { ok: false, error: "Isolated guest test" } });
  if (route.request().method() !== "GET") return route.abort();
  return route.continue();
});
await context.addInitScript(() => { try { localStorage.setItem("gsp-market-update-invitation-due", String(Date.now() + 30 * 86400000)); } catch {} });
const page = await context.newPage();
page.on("pageerror", error => report.failures.push({ kind: "browser", message: error.message, route: page.url() }));
try {
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const route of routes) {
      const response = await page.goto(origin + route, { waitUntil: "networkidle" });
      const geometry = await page.evaluate(() => {
        const root = document.documentElement;
        const controls = [...document.querySelectorAll(".finance-topbar button,.finance-topbar a")].filter(e => e.getClientRects().length);
        return { width: root.clientWidth, scroll: root.scrollWidth, h1: document.querySelectorAll("h1").length, ads: document.querySelectorAll(".ad-slot").length, clippedControls: controls.filter(e => { const b = e.getBoundingClientRect(); return b.left < 0 || b.right > root.clientWidth + 1 || b.top < 0; }).map(e => e.getAttribute("aria-label") || e.textContent), offenders: [...document.querySelectorAll(".finance-main *")].filter(e => { const b=e.getBoundingClientRect(); return b.right > root.clientWidth + 1 && !e.closest(".metals-table,.table-scroll,.recharts-wrapper"); }).slice(0,5).map(e => e.className) };
      });
      const pass = response.status() === 200 && geometry.width === geometry.scroll && geometry.h1 === 1 && !geometry.ads && !geometry.clippedControls.length && !geometry.offenders.length;
      report.checks.push({ route, width, height, status: response.status(), ...geometry, pass });
      if (!pass) report.failures.push(report.checks.at(-1));
      if (width < 640) {
        const smallTargets = await page.locator(".finance-topbar button").evaluateAll(elements => elements.filter(e => e.getClientRects().length).filter(e => { const r=e.getBoundingClientRect(); return r.width < 43.9 || r.height < 43.9; }).map(e => e.getAttribute("aria-label") || e.textContent));
        if (smallTargets.length) report.failures.push({ route, width, kind: "small-touch-target", smallTargets });
      }
      if (width === 320) {
        const html = await response.text();
        if (!/<h1[ >]/.test(html)) report.failures.push({ route, kind: "server-heading-missing" });
        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        if (!canonical || new URL(canonical).pathname !== route) report.failures.push({ route, kind: "canonical", canonical });
        if (route.startsWith("/gold-price/") || route.endsWith("-price-last-10-days") || route === "/historical-prices") {
          const robots = await page.locator('meta[name="robots"]').getAttribute("content");
          if (!robots?.includes("noindex")) report.failures.push({ route, kind: "missing-noindex" });
        }
      }
    }
    console.log(`Viewport ${width}x${height}: ${routes.length} routes checked.`);
    if (width >= 1100) {
      const sidebar = await page.locator(".finance-sidebar").evaluate(el => {
        el.scrollTop = el.scrollHeight;
        const last = el.querySelector(".finance-side-footer a:last-child").getBoundingClientRect();
        const box = el.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, last: last.bottom, viewport: innerHeight };
      });
      if (sidebar.top < 0 || sidebar.bottom > height + 1 || sidebar.last > height + 1) report.failures.push({ kind: "sidebar-scroll", width, height, ...sidebar });
    }
  }
  for (const route of ["/metals/learn/not-a-guide", "/calculators/not-a-tool", "/gold-price/not-a-city"]) {
    assert.equal((await page.goto(origin + route)).status(), 404);
  }
  for (const [oldRoute,newRoute] of [["/calculator","/calculators/gold"],["/investment-return-calculator","/calculators/investment-return"]]) {
    await page.goto(origin + oldRoute); assert.equal(new URL(page.url()).pathname, newRoute);
  }
  const sitemap = await (await context.request.get(origin + "/sitemap.xml")).text();
  assert.ok(sitemap.includes("/metals/learn/methodology"));
  assert.ok(!sitemap.includes("/gold-price/mumbai") && !sitemap.includes("-price-last-10-days"));
  assert.equal((await context.request.get(origin + "/ads.txt")).status(), 404);
  report.seo = "Server headings, canonical paths, gated-route noindex, sitemap exclusions, unknown 404s, legacy redirects and unconfigured ads.txt checked.";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + "/metals");
  const open = page.getByRole("button", { name: "Open menu", exact: true });
  await open.click();
  await page.getByRole("button", { name: "Close menu", exact: true }).waitFor();
  assert.equal(await page.locator(".finance-main").evaluate(el => el.inert), true);
  await page.keyboard.press("Shift+Tab");
  assert.equal(await page.evaluate(() => !!document.activeElement.closest("#finance-mobile-drawer")), true);
  await page.keyboard.press("Escape");
  assert.equal(await open.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator(".finance-main").evaluate(el => el.inert), false);
  report.drawer = "Open, focus trap, Escape, focus restore and background inert passed.";
  await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
  const theme = await page.locator("html").getAttribute("data-theme");
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
  await page.goto(origin + "/calculators/gold-jewellery");
  await page.locator('input[name="rate"]').fill("100");
  await page.locator('input[name="weight"]').fill("10");
  await page.getByRole("button", { name: "Calculate estimate", exact: true }).click();
  assert.match(await page.locator(".metals-results").innerText(), /1,000/);
  await page.getByRole("button", { name: "Save estimate", exact: true }).click();
  await page.locator(".metals-saved li").waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Load", exact: true }).click();
  assert.equal(await page.locator('input[name="rate"]').inputValue(), "100");
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector(".metals-saved li"));
  report.guestEstimate = "Manual calculation, save, reload, load and delete passed.";
  const blocked = await browser.newContext({ serviceWorkers: "block" });
  await blocked.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/api/auth/me") return route.fulfill({ json: { ok: true, data: { user: null } } });
    if (url.pathname.startsWith("/api/")) return route.fulfill({ status: 503, json: { ok: false, error: "Test-only unavailable" } });
    return route.continue();
  });
  await blocked.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Test blocked storage", "SecurityError"); } }); });
  const blockedPage = await blocked.newPage();
  await blockedPage.goto(origin + "/calculators/copper", { waitUntil: "networkidle" });
  await blockedPage.locator('input[name="rate"]').fill("100");
  await blockedPage.locator('input[name="weight"]').fill("2");
  await blockedPage.getByRole("button", { name: "Calculate estimate", exact: true }).click();
  assert.match(await blockedPage.locator(".metals-results").innerText(), /200/);
  await blockedPage.getByRole("button", { name: "Save estimate", exact: true }).click();
  await blockedPage.getByText(/Not saved:/).waitFor();
  report.blockedStorage = "Calculation works with provider and local storage unavailable; failed save disclosed.";
  await blocked.close();
  for (const [width,height,route,name] of [[390,844,"/metals","mobile-overview"],[768,1024,"/calculators/gold-jewellery","tablet-calculator"],[1366,768,"/metals","laptop-overview"],[1920,1080,"/metals/learn/hallmarking","desktop-guide"]]) {
    await page.setViewportSize({ width, height });
    await page.goto(origin + route, { waitUntil: "networkidle" });
    for (const theme of ["light", "dark"]) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; localStorage.setItem("gsp-theme", theme); }, theme);
      await page.screenshot({ path: `${output}/${name}-${theme}.png`, fullPage: true });
      await page.screenshot({ path: `${output}/${name}-${theme}-viewport.png` });
      report.screenshots.push(`${output}/${name}-${theme}.png`);
    }
  }
} catch (error) { report.failures.push({ kind: "functional", message: String(error) }); }
finally { await browser.close(); await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2)); }
console.log(JSON.stringify({ checks: report.checks.length, failures: report.failures.length, report: output + "/report.json" }));
if (report.failures.length) process.exitCode = 1;
