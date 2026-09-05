"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Bell, RefreshCw, Star } from "lucide-react";
import { formatCurrencyRate, type CurrencyRate } from "../../lib/currencies";
import CurrencyConverter from "./CurrencyConverter";
import CurrencyPriceChart from "./CurrencyPriceChart";
import type { WatchlistItem } from "../../lib/storage";
import { useLiveRefresh } from "../_hooks/useLiveRefresh";

const colors = ["#34d399", "#60a5fa", "#a78bfa", "#f59e0b", "#f472b6", "#38bdf8", "#4ade80", "#fb7185"];

export default function CurrencyDashboard({ detailPair }: { detailPair?: string }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "inr" | "major">("all");
  const [sort, setSort] = useState<"pair" | "change" | "rate">("pair");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch(detailPair ? `/api/currencies/current?pair=${detailPair}` : "/api/currencies/current", { cache: "no-store", signal });
    const payload = await response.json() as { rates?: CurrencyRate[]; status?: string; error?: string };
    if (!response.ok || payload.status !== "available") throw new Error(payload.error || "Live currency data is temporarily unavailable.");
    return payload.rates || [];
  }, [detailPair]);
  const live = useLiveRefresh({ load, intervalMs: 5 * 60_000, initialData: [] as CurrencyRate[] });
  const rates = useMemo(() => live.data || [], [live.data]);
  const status = live.loading ? "loading" : live.error ? "unavailable" : "ready";

  useEffect(() => {
    fetch("/api/storage/watchlist", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { data?: WatchlistItem[] } | null) => {
        const items = payload?.data ?? [];
        setWatchlistItems(items);
        setWatchlist(items.filter((item) => item.assetType === "currency").map((item) => item.assetKey));
      })
      .catch(() => undefined);
  }, []);

  const filtered = useMemo(() => rates.filter((item) => {
    const matchesTab = tab === "all" || item.pair.market === tab;
    const matchesQuery = !query.trim() || `${item.pair.symbol} ${item.pair.name}`.toLowerCase().includes(query.toLowerCase().trim());
    return matchesTab && matchesQuery;
  }).sort((a, b) => sort === "change" ? (b.changePercentage ?? -Infinity) - (a.changePercentage ?? -Infinity) : sort === "rate" ? (b.rate ?? -Infinity) - (a.rate ?? -Infinity) : a.pair.symbol.localeCompare(b.pair.symbol)), [rates, query, sort, tab]);

  async function toggleWatchlist(item: CurrencyRate) {
    const assetKey = `currency:${item.pair.slug}`;
    const existing = watchlistItems.find((saved) => saved.assetKey === assetKey);
    const response = existing
      ? await fetch(`/api/storage/watchlist?id=${encodeURIComponent(existing.id)}`, { method: "DELETE" })
      : await fetch("/api/storage/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetKey, symbol: item.pair.symbol, name: item.pair.name, assetType: "currency", route: `/currencies/${item.pair.slug}`, market: "forex" }) });
    if (response.ok) {
      setWatchlist((current) => existing ? current.filter((value) => value !== assetKey) : [...current, assetKey]);
      setWatchlistItems((current) => existing ? current.filter((value) => value.id !== existing.id) : [...current, { id: assetKey, assetKey, symbol: item.pair.symbol, name: item.pair.name, assetType: "currency", route: `/currencies/${item.pair.slug}`, market: "forex", addedAt: Date.now(), updatedAt: Date.now() }]);
    }
  }

  const featured = filtered.slice(0, 4);
  const chartRate = rates.find((item) => item.status === "available") ?? rates[0];

  return (
    <div className="currency-module">
      <section className="currency-toolbar glass-panel">
        <div><span className="finance-eyebrow">Live reference rates</span><h2>Global FX markets</h2><p>Track major currency pairs and INR crosses with source timestamps.</p></div>
        <div className="currency-toolbar-actions"><input aria-label="Search currency pairs" placeholder="Search pairs..." value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" onClick={() => void live.refresh()} disabled={live.loading || live.refreshing}><RefreshCw size={16} />{live.refreshing ? "Refreshing…" : "Refresh"}</button></div>
      </section>
      <div className="currency-tabs" role="tablist" aria-label="Currency market filter">{([["all", "All pairs"], ["inr", "INR pairs"], ["major", "Major pairs"]] as const).map(([value, label]) => <button className={tab === value ? "active" : ""} key={value} onClick={() => setTab(value)} type="button">{label}</button>)}</div>
      {status === "loading" ? <div className="currency-empty glass-panel">Loading verified currency rates...</div> : status === "unavailable" ? <div className="currency-empty glass-panel">Frankfurter reference FX feed · Unavailable: {live.error}</div> : null}
      <div className="asset-card-row currency-card-row">{featured.map((item, index) => <CurrencyCard item={item} color={colors[index % colors.length]} watched={watchlist.includes(`currency:${item.pair.slug}`)} onWatch={() => toggleWatchlist(item)} key={item.pair.slug} />)}</div>
      <div className="currency-main-grid">
        <section className="glass-panel currency-table-panel"><div className="panel-head"><div><span className="finance-eyebrow">Market table</span><h2>Currency pairs</h2></div><select aria-label="Sort currency pairs" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="pair">Sort by pair</option><option value="change">Sort by change</option><option value="rate">Sort by rate</option></select></div><div className="currency-table-wrap"><table className="currency-table"><thead><tr><th>Pair</th><th>Rate</th><th>Change</th><th>Change %</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => <CurrencyRow item={item} watched={watchlist.includes(`currency:${item.pair.slug}`)} onWatch={() => toggleWatchlist(item)} key={item.pair.slug} />)}</tbody></table></div></section>
        <aside className="currency-side-stack"><CurrencyConverter />{chartRate ? <CurrencyPriceChart pair={chartRate.pair} /> : null}</aside>
      </div>
      <section className="currency-disclaimer"><strong>About these rates</strong><p>Rates are reference mid-market values from the provider and are not guaranteed bank, card, cash-exchange or remittance rates. Always confirm the final rate and fees with your financial institution.</p></section>
    </div>
  );
}

function CurrencyCard({ item, color, watched, onWatch }: { item: CurrencyRate; color: string; watched: boolean; onWatch: () => void }) {
  const up = (item.changePercentage ?? 0) >= 0;
  return <article className="market-card currency-card"><div className="market-card-top"><div className="asset-badge" style={{ "--asset-color": color } as React.CSSProperties}>{item.pair.base.slice(0, 2)}</div><span className={up ? "trend up" : "trend down"}>{up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{item.changePercentage === null ? "—" : `${item.changePercentage >= 0 ? "+" : ""}${item.changePercentage.toFixed(2)}%`}</span></div><h3>{item.pair.symbol}</h3><p>{item.pair.name}</p><strong style={{ color }}>{formatCurrencyRate(item.rate, item.pair)}</strong><div className="currency-card-actions"><button type="button" onClick={onWatch} aria-label={`${watched ? "Remove" : "Add"} ${item.pair.symbol} watchlist`}><Star size={15} fill={watched ? "currentColor" : "none"} />{watched ? "Watching" : "Watch"}</button><Link href={`/currencies/${item.pair.slug}`}>Details</Link></div></article>;
}

function CurrencyRow({ item, watched, onWatch }: { item: CurrencyRate; watched: boolean; onWatch: () => void }) {
  const up = (item.changePercentage ?? 0) >= 0;
  const alertParams = new URLSearchParams({ asset: `currency:${item.pair.slug}`, symbol: item.pair.symbol, name: item.pair.name, type: "currency" });
  return <tr><td><Link href={`/currencies/${item.pair.slug}`}><strong>{item.pair.symbol}</strong><small>{item.pair.name}</small></Link></td><td>{formatCurrencyRate(item.rate, item.pair)}</td><td className={up ? "positive" : "negative"}>{item.changeAmount === null ? "—" : `${item.changeAmount >= 0 ? "+" : ""}${formatCurrencyRate(item.changeAmount, item.pair)}`}</td><td className={up ? "positive" : "negative"}>{item.changePercentage === null ? "—" : `${item.changePercentage >= 0 ? "+" : ""}${item.changePercentage.toFixed(2)}%`}</td><td><button className="currency-action-button" type="button" onClick={onWatch} aria-label={`${watched ? "Remove" : "Add"} ${item.pair.symbol} watchlist`}><Star size={15} fill={watched ? "currentColor" : "none"} /></button><Link className="currency-action-button" href={`/alerts?${alertParams.toString()}`} aria-label={`Set ${item.pair.symbol} alert`}><Bell size={15} /></Link></td></tr>;
}
