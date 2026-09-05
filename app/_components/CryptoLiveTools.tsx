"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, RefreshCw, Star, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cryptoAssets, type CryptoAsset } from "../../lib/crypto";
import { useLiveRefresh } from "../_hooks/useLiveRefresh";

type MarketResponse = { assets: CryptoAsset[]; source: string; updatedAt: string; status?: "available" | "unavailable"; error?: string };
const watchlistKey = "gsp-crypto-watchlist";
const portfolioKey = "gsp-crypto-portfolio";

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

export function CryptoLocalWorkspace() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState("bitcoin");
  const [quantity, setQuantity] = useState(0.01);
  const [saved, setSaved] = useState(false);
  useEffect(() => { try { const storedWatchlist = JSON.parse(localStorage.getItem(watchlistKey) || "[]"); const storedPortfolio = JSON.parse(localStorage.getItem(portfolioKey) || "{}"); if (Array.isArray(storedWatchlist)) setWatchlist(storedWatchlist.filter((item): item is string => typeof item === "string")); if (storedPortfolio && typeof storedPortfolio === "object") setPortfolio(storedPortfolio); } catch { /* ignore malformed local state */ } }, []);
  const toggleWatchlist = (slug: string) => { const next = watchlist.includes(slug) ? watchlist.filter((item) => item !== slug) : [...watchlist, slug]; setWatchlist(next); localStorage.setItem(watchlistKey, JSON.stringify(next)); };
  const addHolding = () => { const next = { ...portfolio, [selected]: Math.max(0, Number(portfolio[selected] || 0) + Math.max(0, quantity)) }; setPortfolio(next); localStorage.setItem(portfolioKey, JSON.stringify(next)); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  const watchAssets = useMemo(() => cryptoAssets.filter((asset) => watchlist.includes(asset.slug)), [watchlist]);
  const portfolioAssets = useMemo(() => cryptoAssets.filter((asset) => Number(portfolio[asset.slug]) > 0), [portfolio]);
  return <section className="crypto-local-workspace"><div className="glass-panel crypto-local-card"><div className="crypto-live-heading"><div><span className="finance-eyebrow">Saved locally</span><h2>Watchlist</h2></div><Star size={19} /></div><div className="crypto-local-actions">{cryptoAssets.slice(0, 6).map((asset) => <button className={watchlist.includes(asset.slug) ? "active" : ""} key={asset.slug} type="button" onClick={() => toggleWatchlist(asset.slug)}>{asset.symbol}</button>)}</div>{watchAssets.length ? <div className="crypto-mini-list">{watchAssets.map((asset) => <Link href={`/crypto/${asset.slug}`} key={asset.slug}>{asset.name}<ChevronRight size={14} /></Link>)}</div> : <p className="crypto-local-empty">Choose symbols above to save a local watchlist.</p>}</div><div className="glass-panel crypto-local-card"><div className="crypto-live-heading"><div><span className="finance-eyebrow">No account required</span><h2>Quick holding</h2></div><Wallet size={19} /></div><div className="crypto-local-form"><select value={selected} onChange={(event) => setSelected(event.target.value)}>{cryptoAssets.map((asset) => <option value={asset.slug} key={asset.slug}>{asset.name} ({asset.symbol})</option>)}</select><input type="number" min="0" step="0.000001" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /><button className="primary-button" type="button" onClick={addHolding}>Save holding</button></div>{saved ? <p className="crypto-local-saved"><Check size={15} />Saved to this browser</p> : null}<div className="crypto-mini-list">{portfolioAssets.length ? portfolioAssets.map((asset) => <span key={asset.slug}>{asset.symbol}: {portfolio[asset.slug]}</span>) : <p className="crypto-local-empty">Add a holding to begin a browser-local portfolio.</p>}</div></div></section>;
}
