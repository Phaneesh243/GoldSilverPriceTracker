import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = process.env.TEST_ORIGIN || "http://localhost:3007";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw Error("Local preview required");
const retired = /^\/(?:api\/|news\/)?(?:stocks|crypto|mutual-funds|funds|bonds|insurance|currencies)(?:\/|$)/;
const modules = ["stocks", "crypto", "mutual-funds", "bonds", "insurance", "currencies"];
const gone = [...modules.flatMap(m => ["/" + m, "/" + m + "/removed-detail", "/api/" + m]),
  "/api/stocks/quotes", "/api/crypto/markets", "/api/mutual-funds/nav",
  "/api/currencies/current", "/api/currencies/history", "/api/currencies/pairs",
  "/api/insurance/providers", "/api/insurance/categories",
  ...["stocks", "crypto", "funds", "bonds", "insurance", "currencies"].map(m => "/news/" + m), "/calculators/currency"];
const paths = ["/", "/metals", "/gold-price-today", "/silver-price-today", "/platinum-price-today", "/copper-price-today", "/news", "/calculators", "/calculators/gold", "/watchlist", "/portfolio", "/notifications", "/search"];
const sizes = [[320,568], [390,844], [768,1024], [1024,768], [1366,768], [1920,1080]];
const report = { routes: [], removed: [], screenshots: [], errors: [], accountMode: "Isolated test fixtures; no database writes or messages" };
const output = "test-results/module-removal";
await mkdir(output, {recursive:true});
const manifest = JSON.parse(await readFile(".next/server/app-paths-manifest.json", "utf8"));
assert.ok(Object.keys(manifest).every(path => !retired.test(path)), "Removed routes must not be compiled");
const browser = await chromium.launch({headless:true, chromiumSandbox:true, channel:process.env.TEST_BROWSER_CHANNEL || "msedge"});
const context = await browser.newContext({serviceWorkers:"block"});
let signedIn = false;
await context.route("**/*", route => {
  const url = new URL(route.request().url());
  if (url.origin !== origin || route.request().method() !== "GET") return route.abort();
  if (url.pathname === "/api/auth/me") return route.fulfill({json:{ok:true,data:{user:signedIn ? {id:"usr_isolated_browser",email:"test@example.test",displayName:"Test"} : null}}});
  if (url.pathname === "/api/storage/watchlist" && signedIn) return route.fulfill({json:{ok:true,data:[{id:"watch_legacy",assetKey:"stock:legacy",symbol:"LEGACY",name:"Historical record",assetType:"stock",route:"/stocks/legacy",notes:"Retained user record"}]}});
  if (url.pathname.startsWith("/api/storage/") || url.pathname.startsWith("/api/notifications/")) return route.fulfill({status:401,json:{ok:false,error:"Isolated guest check"}});
  return route.continue();
});
await context.addInitScript(() => { try { localStorage.setItem("gsp-market-consent-v3:guest:due", String(Date.now()+86400000)); } catch { /* Cross-origin chart frames may deny storage. */ } });
const page = await context.newPage();
page.on("pageerror", error => report.errors.push({path:page.url(),error:error.message}));
try {
  for (const path of gone) {
    const response = await context.request.get(origin + path);
    assert.equal(response.status(), 404, path);
    report.removed.push({path,status:response.status()});
  }
  const sitemap = await (await context.request.get(origin + "/sitemap.xml")).text();
  for (const match of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) assert.ok(!retired.test(new URL(match[1]).pathname), match[1]);
  assert.equal((await context.request.get(origin + "/api/news?category=stocks")).status(),400);
  const dashboard = await (await context.request.get(origin + "/api/dashboard")).json();
  for (const name of modules) assert.equal(dashboard[name],undefined);
  assert.deepEqual(dashboard.metals.metals.map(m=>m.key),["gold","silver","platinum","copper"]);
  for (const [width,height] of sizes) {
    await page.setViewportSize({width,height});
    for (const path of paths) {
      const response = await page.goto(origin+path,{waitUntil:"networkidle",timeout:60000});
      assert.equal(response.status(),200,path);
      const result = await page.evaluate(() => ({
        width:document.documentElement.clientWidth,
        scroll:document.documentElement.scrollWidth,
        links:[...document.querySelectorAll('a[href^="/"]')].map(a=>a.getAttribute("href")),
        clipped:[...document.querySelectorAll(".finance-topbar button,.finance-topbar a")].filter(e=>e.getClientRects().length).some(e=>{const b=e.getBoundingClientRect();return b.left<0 || b.right>innerWidth+1;})
      }));
      assert.equal(result.scroll,result.width,path+" @ "+width);
      assert.ok(!result.clipped,path+" navbar");
      assert.ok(result.links.every(link=>!retired.test(link)),path+" retired link");
      report.routes.push({path,width,height,status:200});
      if (path === "/" && [390,1366].includes(width)) {
        const file=output+"/dashboard-"+width+".png";
        await page.screenshot({path:file,fullPage:true});report.screenshots.push(file);
      }
    }
    if (width<1100) {
      await page.getByRole("button",{name:"Open menu",exact:true}).click();
      await page.locator("#finance-mobile-drawer").waitFor({state:"visible"});
      assert.equal(await page.locator("#finance-mobile-drawer a").count(),7);
      await page.keyboard.press("Escape");
      await page.locator("#finance-mobile-drawer").waitFor({state:"hidden"});
    } else {
      assert.ok(await page.locator(".finance-sidebar").isVisible());
      await page.locator(".finance-sidebar").evaluate(el=>{el.scrollTop=el.scrollHeight;});
      const bottom=await page.locator(".finance-side-footer a:last-child").boundingBox();
      assert.ok(bottom.y+bottom.height<=height+1,"Sidebar final item reachable");
    }
    console.log(width+"x"+height+": "+paths.length+" retained routes passed");
  }
  signedIn=true;
  await page.goto(origin+"/watchlist",{waitUntil:"networkidle"});
  await page.getByText("Historical record",{exact:true}).waitFor();
  assert.equal(await page.locator('a[href^="/stocks"]').count(),0);
  await page.getByRole("button",{name:"Open asset results"}).click();
  const choices=await page.getByRole("option").filter({has:page.locator("strong")}).allTextContents();
  assert.equal(choices.length,4);
  for (const name of ["Gold","Silver","Platinum","Copper"]) assert.ok(choices.some(text=>text.includes(name)));
  assert.ok(await page.getByRole("button",{name:"Edit note for Historical record"}).isVisible());
  assert.ok(await page.getByRole("button",{name:"Remove Historical record"}).isVisible());
  await page.goto(origin+"/search",{waitUntil:"networkidle"});
  await page.getByRole("textbox",{name:"Search assets and research"}).fill("gold");
  assert.ok(await page.locator(".search-result-row").count()>0);
  assert.deepEqual(report.errors,[]);
  console.log("Removed URLs, sitemap, metals-only dashboard, drawer, watchlist picker, legacy records and search passed.");
} finally {
  await writeFile(output+"/report.json",JSON.stringify(report,null,2));
  await browser.close();
}
