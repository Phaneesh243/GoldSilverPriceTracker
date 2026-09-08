"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import MetalCalculator from "./MetalCalculator";
import type { MetalPrice } from "../../lib/metal-prices";
import { goldSilverRatio, normalizeReference, referenceInstruments } from "../../lib/metals-data";
import { AssetActionButtons } from "./WatchlistAlertsClient";
export default function MetalQuoteCards({ initial, showTools = false }: { initial: MetalPrice[]; showTools?: boolean }) {
  const [quotes, setQuotes] = useState(initial); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null); const last = useRef(0);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { const tick = () => setNow(Date.now()); tick(); const timer = setInterval(tick, 60000); return () => clearInterval(timer); }, []);
  const displayed = quotes.map(q => {
    if (!q.provenance || now === null) return q;
    const p = q.provenance;
    try { return { ...q, ...normalizeReference(q.key, { symbol: referenceInstruments[q.key].symbol, currency: p.originalCurrency, price: p.originalPrice, updatedAt: q.observedAt }, { base: "USD", date: p.fxDate, rates: { INR: p.fxRate } }, q.fetchedAt, now) }; }
    catch { return { ...q, price: null, freshness: "unavailable" as const, message: "Cached observation no longer passes validation." }; }
  });
  async function refresh(manual = false) {
    if (pending.current || document.visibilityState !== "visible" || (!manual && Date.now() - last.current < 30000)) return;
    const controller = new AbortController(); pending.current = controller; last.current = Date.now(); setBusy(true);
    try { const response = await fetch("/api/metals/current?country=IN", { signal: controller.signal }); if (!response.ok) throw new Error(); const payload = await response.json(); if (controller.signal.aborted) return; if (!Array.isArray(payload.metals)) throw new Error(); setQuotes(initial.map(item => payload.metals.find((q: MetalPrice) => q.key === item.key) || item)); setError(""); }
    catch { if (!controller.signal.aborted) setError("Refresh unavailable. Displayed observation times are unchanged; verify before use."); }
    finally { if (pending.current === controller) { pending.current = null; setBusy(false); } }
  }
  useEffect(() => { const onVisible = () => { void refresh(); }; onVisible(); const interval = setInterval(onVisible, 300000); document.addEventListener("visibilitychange", onVisible); window.addEventListener("focus", onVisible); return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("focus", onVisible); pending.current?.abort(); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const ratio = goldSilverRatio(displayed);
  return <section aria-label="Metal reference prices" className="metals-quotes"><div className="metals-section-heading"><div><h2>Today’s metal references</h2><p className="metals-note">Provider references × daily FX · INR · five-minute cache · not retail quotes</p></div><button className="metals-refresh" disabled={busy} onClick={() => void refresh(true)}><RefreshCw size={16} aria-hidden="true" className={busy ? "metals-spinning" : undefined} />{busy ? "Checking…" : "Refresh prices"}</button></div><span className="metals-sr-only" role="status">{busy ? "Checking reference prices" : "Price check complete"}</span>{error ? <p role="status" className="metals-error">{error}</p> : null}
    <div className="metals-card-grid" aria-busy={busy}>{displayed.map(q => <article className="metals-quote-card" key={q.key} data-metal={q.key} data-availability={q.freshness}>
      <div className="metals-quote-heading"><span className="metals-symbol" aria-hidden="true">{q.symbol}</span><h3><Link href={q.route}>{q.name}</Link></h3><span className="metals-status">{q.freshness === "fresh" ? "Fresh" : q.freshness === "stale" ? "Stale" : "No feed"}</span></div>
      <div className="metals-quote-value"><strong className="metals-price">{typeof q.price === "number" ? `₹${q.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "Unavailable"}</strong><span className="metals-note">{q.price === null ? "Manual tools available" : q.unitLabel + (q.key === "copper" ? " · HG benchmark (lb convention)" : " · fine-metal reference")}</span></div>
      <div className="metals-quote-source">{q.sourceUrl ? <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer">{q.source}</a> : <span>No connected price source</span>}<span>{q.observedAt ? <time dateTime={q.observedAt}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(q.observedAt))} IST</time> : "Observation time unavailable"}</span></div>
      <div className="metals-quote-footer"><details className="metals-quote-details"><summary aria-label={`Source and calculation for ${q.name}`}>Details</summary><p>{q.message}</p>{q.provenance ? <dl className="metals-provenance"><div><dt>FX reference date (not live FX)</dt><dd>{q.provenance.fxDate}</dd></div><div><dt>Calculation</dt><dd>{q.provenance.formula}</dd></div><div><dt>Basis</dt><dd>Excludes taxes, making charges and retailer margins.</dd></div></dl> : null}</details>
      <AssetActionButtons compact asset={{ assetKey: q.key, symbol: q.symbol, name: q.name, assetType: "metal", route: q.route, market: q.key === "copper" ? "HG benchmark, not retail" : "Fine-metal reference, not retail" }} />
      </div>
    </article>)}</div>
    {quotes.length > 1 ? <p className="metals-note">Gold–silver ratio: {ratio !== null ? `${ratio.toFixed(2)} (same currency/unit, observations within five minutes)` : "Unavailable until matching fresh observations exist."} A lower unit price does not mean better investment value.</p> : null}{showTools && displayed.length === 1 ? <ReferenceTools quote={displayed[0]} /> : null}</section>;
}
function ReferenceTools({ quote }: { quote: MetalPrice }) {
  return <><section><h2>Weight breakdown</h2><p className="metals-note">Same refreshed reference and observation as the card above; not a retailer offer.</p><div className="metals-table" tabIndex={0} role="region" aria-label="Weight breakdown"><table><caption>Reference multiplied by weight; no charges or taxes.</caption><thead><tr><th>Quantity</th><th>Reference value (INR)</th></tr></thead><tbody>{[1,10,100,1000].map(weight => <tr key={weight}><td>{weight} {quote.key === "copper" ? "kg" : "g"}</td><td>{quote.price !== null ? "₹" + (quote.price * weight).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "Unavailable"}</td></tr>)}</tbody></table></div></section><MetalCalculator metal={quote.key} price={quote.freshness === "fresh" ? quote.price : null} /></>;
}
