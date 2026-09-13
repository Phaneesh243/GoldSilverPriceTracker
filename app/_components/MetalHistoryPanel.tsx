"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { MetalKey } from "../../lib/metals";
import MetalTradingChart from "./MetalTradingChart";
const Chart = dynamic(() => import("./MetalPriceChart"), { loading: () => <p role="status">Loading history interface…</p> });
export default function MetalHistoryPanel({ metal, color }: { metal: MetalKey; color: string }) {
  const [open, setOpen] = useState(false);
  return <section id="history"><MetalTradingChart metal={metal} /><details className="metals-disclosure" onToggle={event => setOpen(event.currentTarget.open)}><summary>INR history, monthly and year-on-year coverage</summary><p>The international chart above is provided independently by TradingView. Our INR historical feed is not connected, so monthly/annual INR returns and local retail history remain unavailable.</p>{open ? <Chart metal={metal} color={color} /> : null}<p className="metals-note">These calculations require permitted historical observations and matching historical FX, not today’s exchange rate.</p></details></section>;
}
