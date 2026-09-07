"use client";

import Link from "next/link";
import { useCallback } from "react";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { type CryptoAsset } from "../../lib/crypto";
import { useLiveRefresh } from "../_hooks/useLiveRefresh";

type MarketResponse = { assets: CryptoAsset[]; source: string; updatedAt: string; status?: "available" | "unavailable"; error?: string };

function formatUpdated(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }

export function CryptoLivePanel() {
  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch(`/api/crypto/markets?refresh=${Date.now()}`, { cache: "no-store", signal });
    const next = await response.json() as MarketResponse;
    if (!response.ok || next.status !== "available") throw new Error(next.error || "Live crypto market data is unavailable.");
    return next;
  }, []);
  const live = useLiveRefresh({ load, intervalMs: 60_000, initialData: { assets: [], source: "CoinGecko public API", updatedAt: "", status: "unavailable" } as MarketResponse });
  const data = live.data!;
  const loading = live.loading || live.refreshing;
  return <section className="glass-panel crypto-live-panel"><div className="crypto-live-heading"><div><span className="finance-eyebrow">Live market layer</span><h2>INR market prices</h2><small>{loading ? "Refreshing market data…" : live.error ? `${data.source} · Unavailable: ${live.error}` : `${data.source} · Updated ${formatUpdated(data.updatedAt)}`}</small></div><button className="outline-button crypto-refresh-button" type="button" onClick={() => void live.refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "crypto-spin" : ""} />{loading ? "Refreshing…" : "Refresh"}</button></div>{data.assets.length ? <div className="crypto-live-grid">{data.assets.slice(0, 6).map((asset) => <Link href={`/crypto/${asset.slug}`} className="crypto-live-asset" key={asset.slug}><span>{asset.symbol}</span><b>₹{asset.priceInr.toLocaleString("en-IN")}</b><em className={asset.change24h >= 0 ? "positive" : "negative"}>{asset.change24h >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{asset.change24h}%</em></Link>)}</div> : <p className="crypto-live-status">No current crypto values are available from the provider. Retry when the public feed is reachable.</p>}</section>;
}
