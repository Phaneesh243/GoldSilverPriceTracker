"use client";
import { useEffect, useState } from "react";
import type { MetalPrice } from "../../lib/metal-prices";
import MetalQuoteCards from "./MetalQuoteCards";
export default function MetalComparisonClient() {
  const [quotes, setQuotes] = useState<MetalPrice[] | null>(null); const [error, setError] = useState(false);
  useEffect(() => { const controller = new AbortController(); fetch("/api/metals/current", { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { if (!controller.signal.aborted) setQuotes(data.metals); }).catch(() => { if (!controller.signal.aborted) setError(true); }); return () => controller.abort(); }, []);
  return <div className="metals-module">{quotes ? <MetalQuoteCards initial={quotes} /> : error ? <p role="status">Reference comparison is unavailable. Manual tools remain available.</p> : <div role="status" aria-label="Loading metal references" className="metals-card-grid metals-loading">{[0,1,2,3].map(key => <div key={key} aria-hidden="true" className="metals-skeleton"><span /><span /><span /></div>)}</div>}<p>There is no cheapest-metal recommendation: different metals have different uses, risks and quotation units.</p></div>;
}
