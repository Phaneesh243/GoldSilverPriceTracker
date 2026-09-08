// Local UI checks. Only read-only provider requests; account endpoints are isolated.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = process.env.TEST_ORIGIN || "http://localhost:3006";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw Error("Local origin only");
const out = "test-results/metals-refresh";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, chromiumSandbox: true, channel: process.env.TEST_BROWSER_CHANNEL || "msedge" });
const context = await browser.newContext({ serviceWorkers: "block" });
await context.route("**/*", route => {
  const url = new URL(route.request().url());
  if (url.origin !== origin) return route.abort();
  if (url.pathname === "/api/auth/me") return route.fulfill({ json: { ok: true, data: { user: null } } });
  if (url.pathname.startsWith("/api/storage/") || url.pathname.startsWith("/api/notifications/")) return route.fulfill({ status: 401, json: { ok: false } });
  if (route.request().method() !== "GET") return route.abort();
  return route.continue();
});
await context.addInitScript(() => localStorage.setItem("gsp-market-update-invitation-due", String(Date.now() + 86400000)));
const page = await context.newPage();
const report = { date: new Date().toISOString(), checks: [], errors: [], live: [] };
page.on("pageerror", e => report.errors.push(e.message));
try {
  const response = await context.request.get(origin + "/api/metals/current");
  assert.equal(response.status(), 200);
  const payload = await response.json();
  report.live = payload.metals.map(q => ({ key: q.key, status: q.status, freshness: q.freshness, price: q.price, source: q.source, observedAt: q.observedAt, fxDate: q.provenance?.fxDate }));
  for (const key of ["gold", "silver", "platinum", "copper"]) {
    const quote = payload.metals.find(q => q.key === key);
    assert.ok(quote.price > 0 && quote.observedAt && quote.provenance?.fxDate, `${key}: actual provider price required for this live smoke test`);
  }
  for (const key of ["platinum", "copper"]) {
    await page.goto(origin + `/${key}-price-today`, { waitUntil: "networkidle" });
    const card = page.locator(`.metals-quote-card[data-metal="${key}"]`);
    assert.match(await card.locator('.metals-price').innerText(), /^₹/);
    assert.match(await card.locator('.metals-quote-value .metals-note').innerText(), key === "copper" ? /per kg.*HG benchmark/ : /per gram/);
    await page.getByRole('button', { name: 'Refresh prices', exact: true }).click();
    await page.waitForFunction(()=>!document.querySelector('[aria-busy="true"].metals-card-grid'));
    assert.match(await card.locator('.metals-price').innerText(), /^₹/);
  }
  for (const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1366,768],[1920,1080]]) {
    await page.setViewportSize({ width,height });
    for (const theme of ["dark","light"]) {
      await page.goto(origin + "/metals", { waitUntil: "networkidle" });
      await page.evaluate(theme => { document.documentElement.dataset.theme=theme; localStorage.setItem("gsp-theme",theme); },theme);
      const layout = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, cardHeights: [...document.querySelectorAll('.metals-quote-card')].map(e=>e.getBoundingClientRect().height), font: getComputedStyle(document.querySelector('.metals-quote-card')).fontFamily, motion: getComputedStyle(document.querySelector('.metals-quote-card')).animationName }));
      assert.equal(layout.width,layout.scroll);
      assert.ok(layout.cardHeights.every(h=>h<340),JSON.stringify(layout));
      assert.ok(layout.font.includes("Segoe UI"));
      assert.equal(layout.motion,"metals-enter");
      assert.ok(await page.getByPlaceholder("Enter your quoted rate").count());
      assert.equal(await page.locator('.metals-quote-footer summary,.metals-quote-footer .outline-button').evaluateAll(es=>es.filter(e=>{const b=e.getBoundingClientRect();return b.width<44||b.height<44;}).length),0);
      await page.locator(".metals-quote-details summary").first().click();
      assert.match(await page.locator(".metals-quote-details").first().innerText(),/FX reference date/);
      await page.locator(".metals-quote-details summary").first().click();
      await page.screenshot({ path:`${out}/${width}-${theme}.png`,fullPage:true });
      await page.screenshot({ path:`${out}/${width}-${theme}-viewport.png` });
      report.checks.push({ width,height,theme,...layout });
    }
  }
  const before = await page.locator('.metals-quote-card[data-metal="gold"] .metals-price').innerText();
  await page.route("**/api/metals/current?country=IN", route=>route.fulfill({ status:503,json:{error:"Isolated outage"} }));
  await page.getByRole("button",{name:"Refresh prices",exact:true}).click();
  await page.getByText("Refresh unavailable.",{exact:false}).waitFor();
  assert.equal(await page.locator('.metals-quote-card[data-metal="gold"] .metals-price').innerText(),before);
  await page.unroute("**/api/metals/current?country=IN");
  await page.getByRole("button",{name:"Refresh prices",exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('.metals-error'));
  let releaseComparison;
  const comparisonReady = new Promise(resolve => { releaseComparison=resolve; });
  await page.route("**/api/metals/current", async route=>{await comparisonReady;return route.fulfill({json:payload});});
  await page.goto(origin+"/metal-comparison",{waitUntil:"domcontentloaded"});
  await page.getByRole("status",{name:"Loading metal references"}).waitFor();
  assert.equal(await page.locator('.metals-skeleton').count(),4);
  await page.screenshot({path:`${out}/comparison-loading.png`});
  releaseComparison();
  await page.locator('.metals-quote-card').first().waitFor();
  await page.unroute("**/api/metals/current");
  await page.emulateMedia({ reducedMotion:"reduce" });
  assert.equal(await page.locator('.metals-quote-card').first().evaluate(e=>getComputedStyle(e).animationName),"none");
  await page.goto(origin+"/calculators/gold-jewellery",{waitUntil:"networkidle"});
  const missing = await page.locator('.metals-fields input').evaluateAll(es=>es.filter(e=>!e.placeholder).length);
  assert.equal(missing,0);
  report.behavior="Live API, compact cards, 44px card controls, source expansion, placeholders, loading skeletons, refresh outage/recovery and reduced motion passed.";
  assert.deepEqual(report.errors,[]);
} finally { await browser.close(); await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)); }
console.log(JSON.stringify(report,null,2));
