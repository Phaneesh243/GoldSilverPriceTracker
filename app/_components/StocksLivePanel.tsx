"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArrowRight, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { indianStocks } from "../../lib/indian-stocks";
import { AssetActionButtons } from "./WatchlistAlertsClient";
import type { LiveStockQuote } from "../../lib/stock-quotes";
import { useLiveRefresh } from "../_hooks/useLiveRefresh";

type QuoteResponse = { ok?: boolean; data?: LiveStockQuote[]; status?: "available" | "unavailable"; source?: string; fetchedAt?: string; note?: string };

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function formatTime(value?: string) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function StocksLivePanel() {
  const [query, setQuery] = useState("");
  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch(`/api/stocks/quotes?refresh=${Date.now()}`, { cache: "no-store", signal });
    const payload = await response.json() as QuoteResponse;
    if (!response.ok) throw new Error(payload.note || "The stock quote provider is unavailable.");
    if (!payload.data?.length) throw new Error(payload.note || "No current quote was returned by the provider.");
    return payload;
  }, []);
  const live = useLiveRefresh({ load, intervalMs: 60_000 });
  const quotes = useMemo(() => live.data?.data || [], [live.data]);
  const source = live.data?.source || "Yahoo Finance chart";
  const fetchedAt = live.data?.fetchedAt || "";
  const loading = live.loading || live.refreshing;
  const error = live.error;

  const cards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return quotes.map((quote) => ({ quote, stock: indianStocks.find((stock) => stock.slug === quote.slug) })).filter(({ quote, stock }) => !normalized || `${quote.ticker} ${stock?.name || ""} ${stock?.sector || ""}`.toLowerCase().includes(normalized)).slice(0, 12);
  }, [query, quotes]);

  return <div className="stocks-live-module">
    <section className="stocks-live-hero glass-panel"><div><span className="finance-eyebrow">India equity intelligence</span><h2>Live NSE and BSE stock quotes.</h2><p>Search current provider-backed quotes, open a stock research page, compare companies and verify filings before acting.</p></div><div className="stocks-live-actions"><Link className="outline-button" href="/stocks/screener">Open screener <ArrowRight size={15} /></Link><button className="outline-button" type="button" onClick={() => void live.refresh()} disabled={loading}><RefreshCw size={15} />{loading ? "Refreshing…" : "Refresh"}</button></div></section>
    <section className="glass-panel stocks-live-status"><div><b>{loading ? "Refreshing stock provider..." : error ? "Stock provider status" : "Current quote provider"}</b><span>{error || `${source} · fetched ${formatTime(fetchedAt)}`}</span></div><small>Quotes may be delayed or unavailable. Confirm the official NSE/BSE price before trading.</small></section>
    <section className="glass-panel stocks-live-list"><div className="stocks-section-heading"><div><span className="finance-eyebrow">Provider-backed watch</span><h2>Indian stocks returned by the feed</h2></div><input aria-label="Search live stock quotes" placeholder="Search symbol, company or sector" value={query} onChange={(event) => setQuery(event.target.value)} /></div>{cards.length ? <div className="stocks-live-grid">{cards.map(({ quote, stock }) => <article className="stocks-live-card" key={quote.slug}><div className="stocks-card-head"><span className="stocks-card-mark">{quote.ticker.slice(0, 2)}</span><div><h3>{stock?.name || quote.ticker}</h3><small>{quote.ticker} · {quote.exchange} · {stock?.sector || "India equity"}</small></div></div><div className="stocks-live-price"><strong>{formatPrice(quote.price, quote.currency || "INR")}</strong><span className={(quote.changePercent || 0) >= 0 ? "positive" : "negative"}>{quote.changePercent == null ? "Change unavailable" : <>{(quote.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}{quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%</>}</span></div><small className="stocks-live-asof">As of {formatTime(quote.timestamp)}</small><div className="stocks-live-card-actions"><Link className="outline-button" href={`/stocks/${quote.slug}`}>Research <ArrowRight size={14} /></Link><AssetActionButtons compact showAlert asset={{ assetKey: `stock:${quote.slug}`, symbol: quote.ticker, name: stock?.name || quote.ticker, assetType: "stock", route: `/stocks/${quote.slug}`, market: quote.exchange }} /></div></article>)}</div> : <div className="stocks-live-empty"><strong>No live stock values to display.</strong><p>{error || "The provider did not return quotes for the requested universe."}</p><button className="outline-button" type="button" onClick={() => void live.refresh()} disabled={loading}>Retry provider</button></div>}</section>
    <section className="stocks-live-links"><Link className="glass-panel" href="/stocks/nifty-50"><strong>Nifty 50 research</strong><span>Review current membership from the official index source.</span><ArrowRight size={15} /></Link><Link className="glass-panel" href="/stocks/brokers"><strong>Broker and exchange directory</strong><span>Verify registrations, filings and investor resources.</span><ArrowRight size={15} /></Link><Link className="glass-panel" href="/stocks/sebi"><strong>SEBI investor education</strong><span>Read official risk, fraud and account-safety guidance.</span><ArrowRight size={15} /></Link></section>
  </div>;
}
