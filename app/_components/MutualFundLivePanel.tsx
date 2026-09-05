"use client";

import { useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useLiveRefresh } from "../_hooks/useLiveRefresh";

type RecordItem = { schemeCode: string; isin: string; name: string; nav: number; date: string };
type ResponseData = { records: RecordItem[]; source: string; fetchedAt?: string; status: string; error?: string };

export default function MutualFundLivePanel() {
  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch("/api/mutual-funds/nav", { cache: "no-store", signal });
    const payload = await response.json() as ResponseData;
    if (!response.ok || payload.status !== "available") throw new Error(payload.error || "AMFI NAV data is unavailable.");
    return payload;
  }, []);
  const live = useLiveRefresh({ load, intervalMs: 15 * 60_000, initialData: { records: [], source: "AMFI NAVAll.txt", status: "loading" } as ResponseData });
  const data = live.data!;
  const loading = live.loading || live.refreshing;
  return <section className="glass-panel funds-live-panel"><div className="funds-section-heading"><div><span className="finance-eyebrow">Live NAV layer</span><h2>AMFI-published NAV records</h2><small>{loading ? "Refreshing AMFI NAV…" : live.error ? `${data.source} · Unavailable: ${live.error}` : `${data.source} · ${data.records.length} records · latest published NAV dates shown below`}</small></div><button className="outline-button" type="button" onClick={() => void live.refresh()} disabled={loading}><RefreshCw size={15} />{loading ? "Refreshing…" : "Refresh"}</button></div>{data.records.length ? <div className="funds-live-list">{data.records.slice(0, 8).map((item) => <div key={item.schemeCode}><span><b>{item.name}</b><small>{item.schemeCode} · NAV date {item.date}</small></span><strong>₹{item.nav.toLocaleString("en-IN", { maximumFractionDigits: 4 })}</strong></div>)}</div> : <p className="funds-empty">No current NAV values are available. The static reference catalogue is not used as a live fallback.</p>}</section>;
}
