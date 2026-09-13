import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:3007';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw Error('Local tests only');
const browser = await chromium.launch({ headless: true, chromiumSandbox: true, channel: process.env.TEST_BROWSER_CHANNEL || 'msedge' });
const context = await browser.newContext({ serviceWorkers: 'block', viewport: {width:390,height:844} });
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.origin !== origin) return route.abort();
  if (url.pathname === '/api/auth/me') return route.fulfill({json:{ok:true,data:{user:null}}});
  if (url.pathname.startsWith('/api/notifications/') || url.pathname.startsWith('/api/storage/')) return route.fulfill({status:401,json:{ok:false}});
  if (route.request().method() !== 'GET') return route.abort();
  return route.continue();
});
await context.addInitScript(() => localStorage.setItem('gsp-market-consent-v3:guest:due',String(Date.now()+86400000)));
const page = await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const out='test-results/metals-discovery'; await mkdir(out,{recursive:true});
try {
  await page.goto(origin+'/metals',{waitUntil:'networkidle'});
  const search=page.getByRole('combobox');
  await search.fill('gold making'); await search.press('ArrowDown');
  assert.equal(await page.locator('[role=option][aria-selected=true]').count(),1);
  await search.press('Enter'); await page.waitForURL('**/metals/learn/gold-making-charges');
  await page.getByRole('combobox').fill('no-such-topic-xyz');
  await page.getByText('No matches.',{exact:false}).waitFor();
  await page.getByRole('combobox').press('Escape');
  assert.equal(await page.getByRole('listbox').count(),0);
  await page.goto(origin+'/metals',{waitUntil:'networkidle'});
  const card=page.locator('[data-metal=gold]');
  const headingLink=card.locator('.metals-card-link'); await headingLink.hover();
  assert.equal(await headingLink.evaluate(e=>getComputedStyle(e).textDecorationLine),'none');
  await card.locator('summary').click(); assert.equal(await card.locator('details').getAttribute('open'),'');
  await card.locator('summary').click();
  await card.locator('.metals-price').scrollIntoViewIfNeeded();
  const priceBox=await card.locator('.metals-price').boundingBox();
  // A stretched semantic link deliberately covers the price; test a real surface click.
  await page.mouse.click(priceBox.x+priceBox.width/2,priceBox.y+priceBox.height/2); await page.waitForURL('**/gold-price-today');
  const weights=page.getByRole('combobox',{name:'Display weight'});
  assert.equal(await weights.inputValue(),'10'); await weights.selectOption('8');
  await page.reload({waitUntil:'networkidle'}); assert.equal(await weights.inputValue(),'8');
  assert.ok((await page.locator('.metals-basis').innerText()).includes('not a local retail quotation'));
  await page.locator('#news').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('#news')?.textContent.includes('Loading relevant headlines'), null, {timeout:20000});
  await page.screenshot({path:`${out}/gold-mobile-news.png`,fullPage:true});
  await page.setViewportSize({width:1366,height:768});
  await page.goto(origin+'/metals/compare/gold-vs-silver',{waitUntil:'networkidle'});
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('.metals-quote-card').count(),2);
  const sitemap=await (await context.request.get(origin+'/sitemap.xml')).text();
  assert.ok(sitemap.includes('/metals/compare/gold-vs-silver'));
  assert.ok(!sitemap.includes('/gold-price/mumbai'));
  await page.screenshot({path:`${out}/comparison-laptop.png`,fullPage:true});
  const finalDetails=[];
  for (const [width,height] of [[320,568],[375,667],[390,844],[430,932],[768,1024],[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080]]) {
    await page.setViewportSize({width,height}); const descriptions=[];
    for (const metal of ['gold','silver','platinum','copper']) {
      const response=await page.goto(`${origin}/${metal}-price-today`,{waitUntil:'networkidle'}); assert.equal(response.status(),200);
      assert.equal(await page.getByRole('heading',{name:`Before you buy ${metal}`,exact:true}).count(),1);
      const geometry=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      assert.equal(geometry.width,geometry.scroll); descriptions.push(await page.locator('meta[name=description]').getAttribute('content'));
      finalDetails.push({metal,width,height,pass:true});
    }
    assert.equal(new Set(descriptions).size,4);
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/report.json`,JSON.stringify({passed:true,checks:['keyboard search','empty and Escape','colour hover','independent Details','card surface navigation','10g default','persisted weight','reference disclosure','comparison canonical sitemap','unique descriptions and purchase checklists'],finalDetails,errors},null,2));
} finally {await browser.close();}
console.log('Metals discovery and preference checks passed.');
