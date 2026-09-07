"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Bell, CircleDollarSign, Coins, FileText, LineChart, RefreshCw, Shield, Wallet } from "lucide-react";
import type { CurrencyRate } from "../../lib/currencies";
import type { DataEnvelope } from "../../lib/data-envelope";
import type { LivePricePayload } from "../../lib/live-prices";
import type { NewsFeed } from "../../lib/news";
import type { LiveStockQuote } from "../../lib/stock-quotes";
import type { LiveCryptoMarket } from "../../lib/crypto-market-provider";
import { useLiveRefresh } from "../_hooks/useLiveRefresh";

type DashboardPayload = {
  stocks: DataEnvelope<LiveStockQuote[]>;
  crypto: DataEnvelope<LiveCryptoMarket[]>;
  currencies: DataEnvelope<CurrencyRate[]>;
  metals: DataEnvelope<LivePricePayload>;
  news: DataEnvelope<NewsFeed>;
  generatedAt: string;
};

const empty: DashboardPayload = {
  stocks: { data: [], status: "unavailable", source: "", sourceUrl: "", fetchedAt: "", asOf: null, timezone: "UTC", delaySeconds: null },
  crypto: { data: [], status: "unavailable", source: "", sourceUrl: "", fetchedAt: "", asOf: null, timezone: "UTC", delaySeconds: null },
  currencies: { data: [], status: "unavailable", source: "", sourceUrl: "", fetchedAt: "", asOf: null, timezone: "UTC", delaySeconds: null },
  metals: { data: null as unknown as LivePricePayload, status: "unavailable", source: "", sourceUrl: "", fetchedAt: "", asOf: null, timezone: "UTC", delaySeconds: null },
  news: { data: null as unknown as NewsFeed, status: "unavailable", source: "", sourceUrl: "", fetchedAt: "", asOf: null, timezone: "UTC", delaySeconds: null },
  generatedAt: "",
};

function number(value: number | null | undefined, digits = 2) {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-IN", { maximumFractionDigits: digits }) : "Unavailable";
}

function statusText<T>(envelope: DataEnvelope<T>) {
  if (envelope.status === "unavailable") return "Unavailable from provider";
  return envelope.status === "stale" ? "Stale provider data" : envelope.status === "delayed" ? "Delayed provider data" : "Provider data available";
}

export default function LiveDashboardModule() {
  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch(`/api/dashboard?refresh=${Date.now()}`, { cache: "no-store", signal });
    const next = await response.json() as DashboardPayload & { error?: string };
    if (!response.ok) throw new Error(next.error || "Dashboard providers are unavailable.");
    return next;
  }, []);
  const live = useLiveRefresh({ load, intervalMs: 60_000, initialData: empty });
  const payload = live.data || empty;
  const loading = live.loading || live.refreshing;
  const error = live.error;

  const stocks = useMemo(() => payload.stocks.data || [], [payload.stocks.data]);
  const crypto = useMemo(() => payload.crypto.data || [], [payload.crypto.data]);
  const currency = payload.currencies.data?.[0];
  const gold = payload.metals.data?.gold?.[0];
  const bitcoin = crypto.find((item) => item.id === "bitcoin");
  const topMovers = [...stocks].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 6);

  return <div className="dashboard-module">
    <section className="dashboard-hero glass-panel"><div><span className="finance-eyebrow">Unified market intelligence</span><h2>Real data across the markets you follow.</h2><p>Provider-backed prices with visible status, source and timestamps. Unavailable feeds are never replaced with invented values.</p></div><div className="dashboard-hero-actions"><Link className="primary-button" href="/portfolio"><Wallet size={16} />Open portfolio</Link><Link className="outline-button" href="/notifications"><Bell size={16} />Market updates</Link></div></section>
    <section className="glass-panel dashboard-data-status"><div><b>{loading ? "Refreshing providers…" : error ? "Dashboard refresh failed" : "Provider status"}</b><span>{error || "Mumbai metals · Indian equity quotes · crypto · FX · news"}</span></div><button className="outline-button" type="button" onClick={() => void live.refresh()} disabled={loading}><RefreshCw size={15} />Refresh</button></section>
    <section className="dashboard-market-overview"><div className="dashboard-section-heading"><div><span className="finance-eyebrow">Market overview</span><h2>Live provider-backed values</h2></div><small>{live.lastCheckedAt ? `Auto-refreshes while visible · last checked ${new Date(live.lastCheckedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Auto-refreshes while visible"}</small></div><div className="dashboard-market-grid">
      <MarketTile tone="gold" icon={<Coins size={20} />} title="Gold · Mumbai" value={gold ? "₹" + number(gold.pricePerGram) + "/g" : "Unavailable"} change={gold ? (gold.changePercentage >= 0 ? "+" : "") + number(gold.changePercentage) + "%" : statusText(payload.metals)} detail={payload.metals.source || "Metals provider"} href="/metals" />
      <MarketTile tone="blue" icon={<LineChart size={20} />} title="Indian stock quotes" value={stocks.length ? stocks.length + " quotes" : "Unavailable"} change={stocks.length ? "Real provider data" : statusText(payload.stocks)} detail={payload.stocks.source || "Stock provider"} href="/stocks" />
      <MarketTile tone="violet" icon={<CircleDollarSign size={20} />} title="Bitcoin · INR" value={bitcoin?.current_price ? "₹" + number(bitcoin.current_price) : "Unavailable"} change={bitcoin?.price_change_percentage_24h != null ? (bitcoin.price_change_percentage_24h >= 0 ? "+" : "") + number(bitcoin.price_change_percentage_24h) + "%" : statusText(payload.crypto)} detail={payload.crypto.source || "Crypto provider"} href="/crypto" />
      <MarketTile tone="green" icon={<CircleDollarSign size={20} />} title={currency?.pair.symbol || "USD/INR"} value={currency?.rate != null ? number(currency.rate, 4) : "Unavailable"} change={currency?.changePercentage != null ? (currency.changePercentage >= 0 ? "+" : "") + number(currency.changePercentage, 4) + "%" : statusText(payload.currencies)} detail={payload.currencies.source || "FX provider"} href="/currencies" />
      <MarketTile tone="purple" icon={<BarChart3 size={20} />} title="Mutual funds" value="Live NAV feed" change="Open module" detail="Scheme NAV requires AMFI provider data" href="/mutual-funds" />
      <MarketTile tone="cyan" icon={<FileText size={20} />} title="Bonds" value="Live bond feed" change="Provider required" detail="Government and corporate yields are not invented" href="/bonds" />
      <MarketTile tone="rose" icon={<Shield size={20} />} title="Insurance" value="Education and directory" change="No quote" detail="Premiums require insurer quote data" href="/insurance" />
    </div></section>
    <div className="dashboard-main-grid"><section className="glass-panel dashboard-panel"><div className="dashboard-section-heading"><div><span className="finance-eyebrow">Indian markets</span><h2>Live stock movers</h2></div><Link href="/stocks/top-10">Research screens <ArrowRight size={15} /></Link></div><div className="dashboard-mover-list">{topMovers.length ? topMovers.map((stock) => <Link href={"/stocks/" + stock.slug} key={stock.slug}><span className="dashboard-asset-badge">{stock.ticker.slice(0, 2)}</span><span><b>{stock.ticker}</b><small>{stock.exchange} · {stock.source}</small></span><strong>₹{number(stock.price)}</strong><em className={(stock.changePercent || 0) >= 0 ? "positive" : "negative"}>{(stock.changePercent || 0) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{stock.changePercent == null ? "Unavailable" : number(stock.changePercent) + "%"}</em></Link>) : <EmptyState message={statusText(payload.stocks)} />}</div><small className="dashboard-source-line">{payload.stocks.source} · as-of timestamps are provided by the upstream feed.</small></section><aside className="glass-panel dashboard-panel dashboard-portfolio-panel"><div className="dashboard-section-heading"><div><span className="finance-eyebrow">Personal view</span><h2>Portfolio snapshot</h2></div><Wallet size={18} /></div><strong className="dashboard-portfolio-value">Sign in to load</strong><span className="dashboard-portfolio-change">Portfolio values are calculated from your stored transactions and live quotes.</span><div className="dashboard-portfolio-actions"><Link className="primary-button" href="/portfolio">Open portfolio</Link><Link className="outline-button" href="/watchlist">Open watchlist</Link></div></aside></div>
    <section className="glass-panel dashboard-news-panel"><div className="dashboard-section-heading dashboard-news-heading"><div><span className="finance-eyebrow">Latest feed</span><h2>Provider-attributed finance news</h2><p>Fresh market headlines from the sources powering your research.</p></div><Link href="/news">Read all <ArrowRight size={15} /></Link></div><div className="dashboard-news-list">{payload.news.data?.items?.slice(0, 5).map((item) => <a className="dashboard-news-item" href={item.link} target="_blank" rel="noreferrer" key={item.id}><span>{item.source}</span><b>{item.title}</b><small>{item.publishedAt}</small></a>) || <EmptyState message={statusText(payload.news)} />}</div></section>
  </div>;
}

function MarketTile({ tone, icon, title, value, change, detail, href }: { tone: "gold" | "blue" | "violet" | "green" | "purple" | "cyan" | "rose"; icon: React.ReactNode; title: string; value: string; change: string; detail: string; href: string }) {
  return <Link className="dashboard-market-tile glass-panel" data-market-tone={tone} href={href}><span className="dashboard-tile-icon">{icon}</span><small>{title}</small><strong>{value}</strong><em>{change}</em><p>{detail}</p></Link>;
}

function EmptyState({ message }: { message: string }) { return <p className="dashboard-empty-state">{message}. Check the source and retry.</p>; }
