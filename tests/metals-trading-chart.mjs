import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin=process.env.TEST_ORIGIN || 'http://localhost:3007';
if(!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))throw Error('Local test only');
const browser=await chromium.launch({headless:true,chromiumSandbox:true,channel:'msedge'});
const context=await browser.newContext({serviceWorkers:'block'});
await context.addInitScript(()=>localStorage.setItem('gsp-market-consent-v3:guest:due',String(Date.now()+86400000)));
await context.route('**/*',route=>{
 const req=route.request(),url=new URL(req.url());
 if(req.method()!=='GET')return route.abort();
 if(url.origin===origin){
  if(url.pathname==='/api/auth/me')return route.fulfill({json:{ok:true,data:{user:null}}});
  if(url.pathname.startsWith('/api/storage/')||url.pathname.startsWith('/api/notifications/'))return route.fulfill({status:401,json:{ok:false}});
  return route.continue();
 }
 if(url.hostname==='www.tradingview-widget.com'||url.hostname.endsWith('.tradingview.com'))return route.continue();
 return route.abort();
});
const page=await context.newPage();const report={checks:[],screenshots:[]};const out='test-results/metals-charts';await mkdir(out,{recursive:true});
try{
 const response=await page.goto(origin+'/metals',{waitUntil:'domcontentloaded'});
 const csp=response.headers()['content-security-policy'];
 assert.ok(csp.includes('frame-src https://www.tradingview-widget.com'));
 assert.ok(!csp.match(/script-src[^;]*tradingview/));
 for(const [width,height,theme] of [[1366,768,'dark'],[390,844,'light']]){
  await page.setViewportSize({width,height});
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;localStorage.setItem('gsp-theme',theme);},theme);
  await page.locator('.metals-trading-panel').scrollIntoViewIfNeeded();
  for(const metal of ['gold','silver','platinum','copper']){
   await page.getByRole('combobox',{name:'Chart metal',exact:true}).selectOption(metal);
   const frameElement=page.locator('.metals-chart-frame iframe');await frameElement.waitFor();
   const config=JSON.parse(decodeURIComponent(new URL(await frameElement.getAttribute('src')).hash.slice(1)));
   assert.equal(config.theme,theme);
   const frame=page.frameLocator('.metals-chart-frame iframe');
   await frame.locator('canvas').first().waitFor({timeout:45000});
   const hosted=page.frames().find(f=>f.url().startsWith('https://www.tradingview-widget.com/embed-widget/advanced-chart/'));
   // Mobile TradingView intentionally collapses OHLC to the close-price legend.
   await hosted.waitForFunction(()=>/C\s*[\d,]+\.\d+/.test(document.body.innerText),null,{timeout:45000});
   await page.locator('.metals-chart-load-state').waitFor({state:'hidden',timeout:25000});
   // Read visible UI only; do not download or export the provider's historical data.
   const text=await frame.locator('body').innerText();
   assert.ok(!/invalid symbol|only available on TradingView|symbol is not available/i.test(text),text.slice(-800));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0);
   await page.locator('.metals-trading-panel').screenshot({path:`${out}/${metal}-${width}-${theme}.png`});
   report.screenshots.push(`${out}/${metal}-${width}-${theme}.png`);
   report.checks.push({metal,width,height,theme,canvas:true,visiblePriceLegend:true,symbol:config.symbol});
   if(width===1366&&metal==='gold'){
    await page.getByRole('button',{name:'Expand market chart',exact:true}).click();
    await page.waitForFunction(()=>document.fullscreenElement?.classList.contains('metals-trading-panel'));
    await page.getByRole('button',{name:'Expand market chart',exact:true}).click();
    await page.waitForFunction(()=>!document.fullscreenElement);
    report.fullscreen='Enter and exit verified.';
   }
  }
 }
 await page.getByRole('button',{name:'1h',exact:true}).click();
 await page.getByRole('combobox',{name:'Chart style',exact:true}).selectOption('2');
 let config=JSON.parse(decodeURIComponent(new URL(await page.locator('.metals-chart-frame iframe').getAttribute('src')).hash.slice(1)));
 assert.equal(config.interval,'60');assert.equal(config.style,'2');
 await page.route('https://www.tradingview-widget.com/**',route=>route.abort());
 await page.getByRole('button',{name:'Reload market chart',exact:true}).click();
 assert.equal(await page.getByRole('link',{name:'Open full chart',exact:false}).count(),1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0);
 report.controls='Metal, interval, style, theme and blocked-provider fallback checked.';
}catch(e){report.error=String(e);await page.screenshot({path:`${out}/failure.png`,fullPage:true});throw e;}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
