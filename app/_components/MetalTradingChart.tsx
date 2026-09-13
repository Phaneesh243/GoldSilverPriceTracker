"use client";
import { useEffect, useRef, useState } from "react";
import { CandlestickChart, ExternalLink, Maximize2, RefreshCw } from "lucide-react";
import type { MetalKey } from "../../lib/metals";
import { chartIntervals, chartStyles, metalChartInstruments, metalChartLink, metalChartUrl } from "../../lib/metals-chart";

export default function MetalTradingChart({ metal }: { metal?: MetalKey }) {
  const [selected,setSelected]=useState<MetalKey>("gold"); const activeMetal=metal || selected;
  const [theme,setTheme]=useState<"dark"|"light">("dark"); const [compact,setCompact]=useState(false);
  const [interval,setInterval]=useState("D"); const [style,setStyle]=useState("1"); const [visible,setVisible]=useState(false);
  const [attempt,setAttempt]=useState(0); const [fullScreenError,setFullScreenError]=useState("");
  const panel=useRef<HTMLElement>(null);
  useEffect(()=>{
    const updateTheme=()=>setTheme(document.documentElement.dataset.theme==="light"?"light":"dark"); updateTheme();
    const observer=new MutationObserver(updateTheme); observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
    const media=window.matchMedia("(max-width: 639px)"); const resize=()=>setCompact(media.matches); resize(); media.addEventListener("change",resize);
    return ()=>{observer.disconnect();media.removeEventListener("change",resize);};
  },[]);
  useEffect(()=>{if(!panel.current)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:"240px"});observer.observe(panel.current);return()=>observer.disconnect();},[]);
  const instrument=metalChartInstruments[activeMetal]; const src=metalChartUrl(activeMetal,theme,interval,style,compact);
  return <section ref={panel} className="metals-trading-panel" aria-label={`${instrument.name} advanced market chart`}>
    <div className="metals-section-heading"><div className="metals-chart-title"><span className="metals-chart-icon"><CandlestickChart aria-hidden="true" size={24}/></span><div><span className="metals-chart-eyebrow">MARKET CHART</span><h2>{instrument.name} technical chart</h2></div></div><div className="metals-chart-actions"><button type="button" aria-label="Reload market chart" onClick={()=>{setVisible(true);setAttempt(n=>n+1);}}><RefreshCw size={16} aria-hidden="true"/>Reload</button><button type="button" aria-label="Expand market chart" onClick={async()=>{try{if(document.fullscreenElement===panel.current)await document.exitFullscreen();else if(panel.current?.requestFullscreen)await panel.current.requestFullscreen();else throw Error();setFullScreenError("");}catch{setFullScreenError("Full screen is unavailable in this browser. Use Open full chart instead.");}}}><Maximize2 size={16} aria-hidden="true"/>Expand</button></div></div>
    <div className="metals-chart-toolbar">{!metal?<label>Metal<select aria-label="Chart metal" value={selected} onChange={e=>{const value=e.target.value;if(Object.hasOwn(metalChartInstruments,value))setSelected(value as MetalKey);}}>{Object.entries(metalChartInstruments).map(([key,m])=><option key={key} value={key}>{m.name}</option>)}</select></label>:null}<div className="metals-chart-intervals" role="group" aria-label="Candle interval">{chartIntervals.map(item=><button key={item.value} type="button" aria-pressed={interval===item.value} onClick={()=>setInterval(item.value)}>{item.label}</button>)}</div><label>Chart style<select aria-label="Chart style" value={style} onChange={e=>{if(chartStyles.some(s=>s.value===e.target.value))setStyle(e.target.value);}}>{chartStyles.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label></div>
    <div className="metals-chart-basis"><strong>{instrument.symbol}</strong><span>{instrument.unit} · IST display</span><span>International reference / CFD — not an Indian retail quotation</span></div>
    <div className="metals-chart-frame">{visible?<HostedFrame key={`${src}-${attempt}`} src={src} title={`${instrument.name} TradingView advanced chart`} />:<div className="metals-chart-placeholder"><CandlestickChart size={36} aria-hidden="true"/><p>Chart loads as you scroll into view.</p><button type="button" onClick={()=>setVisible(true)}>Load market chart</button></div>}</div>
    <div className="tradingview-widget-copyright"><a href={metalChartLink(activeMetal)} rel="noopener nofollow noreferrer" target="_blank"><span className="blue-text">{instrument.name} chart</span></a><span className="trademark"> by TradingView</span></div>
    <div className="metals-chart-help"><p>Use the chart toolbar for indicators, comparison and chart settings. Drag to pan; zoom to inspect candles. Drawing tools are on the side toolbar on larger screens.</p><a href={metalChartLink(activeMetal)} target="_blank" rel="noopener noreferrer">Open full chart <ExternalLink size={15} aria-hidden="true"/></a></div>
    <p className="metals-note">Source: TradingView / OANDA. Quote timestamps, session and any delay are shown inside the chart. The INR cards use a different feed and daily FX; their values will differ. Changing the outer controls or theme reloads the widget and may reset drawings. No widget data is exported or stored by this app.</p>
    <details className="metals-chart-disclosure"><summary>Chart data, privacy and limitations</summary><p>This external widget connects your browser to TradingView. Available symbols, studies and history depend on the provider. No chart is fabricated when data is unavailable. Use Open full chart if the embed is blocked. Custom Pine scripts, strategy backtests and INR retail history are not included.</p><a href="https://www.tradingview.com/privacy-policy/" target="_blank" rel="noopener noreferrer">TradingView privacy policy</a></details>
    {fullScreenError?<p role="status">{fullScreenError}</p>:null}
  </section>;
}
function HostedFrame({src,title}:{src:string;title:string}) {
  const [state,setState]=useState<"loading"|"frame-loaded"|"slow">("loading");
  useEffect(()=>{const timer=window.setTimeout(()=>setState(s=>s==="loading"?"slow":s),20000);return()=>window.clearTimeout(timer);},[]);
  return <><iframe src={src} title={title} referrerPolicy="no-referrer" allowFullScreen onLoad={()=>setState("frame-loaded")} onError={()=>setState("slow")} />{state!=="frame-loaded"?<div className="metals-chart-load-state" role="status">{state==="loading"?"Connecting to TradingView…":"The chart is taking longer than expected. Try Reload or Open full chart below."}</div>:null}</>;
}
