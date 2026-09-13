import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3007';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw Error('Local test origin required');
const browser = await chromium.launch({headless:true,chromiumSandbox:true,channel:process.env.TEST_BROWSER_CHANNEL || 'msedge'});
const context = await browser.newContext({serviceWorkers:'block'});
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.origin !== origin || route.request().method() !== 'GET') return route.abort();
  if (url.pathname === '/api/auth/me') return route.fulfill({json:{ok:true,data:{user:null}}});
  if (url.pathname.startsWith('/api/')) return route.fulfill({status:503,json:{ok:false,error:'Isolated theme test'}});
  return route.continue();
});
await context.addInitScript(() => localStorage.setItem('gsp-market-consent-v3:guest:due',String(Date.now()+86400000)));
const page = await context.newPage(); const checks=[];
const output='test-results/metals-shared-theme'; await mkdir(output,{recursive:true});
try {
  for (const [width,height] of [[390,844],[1366,768]]) {
    await page.setViewportSize({width,height});
    for (const theme of ['dark','light']) {
      let baseline;
      for (const path of ['/','/metals','/gold-price-today','/calculators/gold-jewellery','/metals/learn/hallmarking']) {
        await page.goto(origin+path,{waitUntil:'networkidle'});
        await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;localStorage.setItem('gsp-theme',theme);},theme);
        const style=await page.locator('.finance-platform').evaluate(el=>{
          const s=getComputedStyle(el);
          return {palette:Object.fromEntries(['--fp-bg','--fp-bg-deep','--fp-panel','--fp-panel-2','--fp-border','--fp-text','--fp-muted','--fp-accent'].map(key=>[key,s.getPropertyValue(key).trim()])),font:s.fontFamily,background:s.backgroundImage};
        });
        if (!baseline) baseline=style; else assert.deepEqual(style,baseline,`${path} must share Dashboard theme`);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0,path);
        checks.push({path,width,height,theme,pass:true});
        if (path==='/metals') await page.screenshot({path:`${output}/${width}-${theme}.png`});
      }
    }
  }
  await writeFile(`${output}/report.json`,JSON.stringify({checks},null,2));
  console.log(`${checks.length} shared-theme and overflow checks passed.`);
} finally {await browser.close();}
