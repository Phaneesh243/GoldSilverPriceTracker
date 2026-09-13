import type { MetalKey } from "./metals";
// Hosted chart instruments are separate from the Gold API/INR reference cards.
export const metalChartInstruments = {
  gold: { name: "Gold", symbol: "OANDA:XAUUSD", unit: "USD / troy oz", description: "Gold / US Dollar · OANDA", route: "/gold-price-today" },
  silver: { name: "Silver", symbol: "OANDA:XAGUSD", unit: "USD / troy oz", description: "Silver / US Dollar · OANDA", route: "/silver-price-today" },
  platinum: { name: "Platinum", symbol: "OANDA:XPTUSD", unit: "USD / troy oz", description: "Platinum / US Dollar · OANDA", route: "/platinum-price-today" },
  copper: { name: "Copper", symbol: "OANDA:XCUUSD", unit: "USD / lb", description: "Copper CFD · OANDA", route: "/copper-price-today" },
} satisfies Record<MetalKey, {name:string;symbol:string;unit:string;description:string;route:string}>;
export const chartIntervals = [{value:"15",label:"15m"},{value:"60",label:"1h"},{value:"240",label:"4h"},{value:"D",label:"1D"},{value:"W",label:"1W"}];
export const chartStyles = [{value:"1",label:"Candles"},{value:"2",label:"Line"},{value:"3",label:"Area"}];
export function metalChartUrl(metal: MetalKey, theme: "dark" | "light", interval: string, style: string, compact: boolean) {
  const instrument = metalChartInstruments[metal];
  if (!Object.hasOwn(metalChartInstruments,metal) || !instrument || !["dark","light"].includes(theme) || !chartIntervals.some(i=>i.value===interval) || !chartStyles.some(s=>s.value===style)) throw Error("Unsupported chart configuration");
  // Equivalent to the iframe emitted by TradingView's official advanced-chart embed.
  // No account data, private inputs, page URL or query string is forwarded.
  const config = {symbol:instrument.symbol,interval,style,theme,timezone:"Asia/Kolkata",locale:"en",autosize:true,allow_symbol_change:false,hide_top_toolbar:false,hide_side_toolbar:compact,hide_legend:false,hide_volume:true,withdateranges:true,save_image:true,calendar:false,details:false,hotlist:false,studies:[],compareSymbols:[],backgroundColor:theme==="dark"?"#0d1c2d":"#ffffff",gridColor:theme==="dark"?"rgba(170,182,199,0.08)":"rgba(100,116,139,0.10)",utm_medium:"widget_new",utm_campaign:"advanced-chart"};
  return "https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#" + encodeURIComponent(JSON.stringify(config));
}
export const metalChartLink = (metal: MetalKey) => `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(metalChartInstruments[metal].symbol)}`;
