"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { indianStocks } from "../../lib/indian-stocks";
import { cryptoAssets } from "../../lib/crypto";
import { currencyPairs } from "../../lib/currencies";
import { insuranceProviders } from "../../lib/insurance";
import { mutualFunds } from "../../lib/mutual-funds";

type Result = { name: string; type: string; href: string; meta: string };

export default function SearchModule() {
  const [query, setQuery] = useState("");
  const results = useMemo<Result[]>(() => [
    ...indianStocks.map((item) => ({ name: item.name, type: "Stock", href: "/stocks/" + item.slug, meta: item.symbol + " · " + item.sector })),
    ...cryptoAssets.map((item) => ({ name: item.name, type: "Crypto", href: "/crypto/" + item.slug, meta: item.symbol + " · " + item.chain })),
    ...mutualFunds.map((item) => ({ name: item.name, type: "Mutual fund", href: "/mutual-funds/" + item.slug, meta: item.amc + " · " + item.category })),
    ...insuranceProviders.map((item) => ({ name: item.name, type: "Insurance", href: "/insurance/providers/" + item.slug, meta: item.type + " provider" })),
    ...currencyPairs.map((item) => ({ name: item.symbol, type: "Currency", href: "/currencies/" + item.slug, meta: item.name })),
  ].filter((item) => (item.name + " " + item.meta + " " + item.type).toLowerCase().includes(query.toLowerCase().trim())).slice(0, 40), [query]);
  return <div className="search-module"><section className="search-command glass-panel"><span className="finance-eyebrow">Unified search</span><h1>Search assets and research pages.</h1><p>Search results link to module pages; current values are loaded by the destination provider.</p><label className="large-search"><Search size={18} /><input autoFocus aria-label="Search assets and research" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stocks, crypto, funds, insurance or currencies" /></label></section><section className="glass-panel search-results-panel"><div className="search-results-heading"><h2>{query ? results.length + " results" : "Popular asset pages"}</h2><Link href="/watchlist">Open watchlist <ArrowRight size={15} /></Link></div>{results.map((result) => <Link className="search-result-row" href={result.href} key={result.type + result.href}><span>{result.type}</span><b>{result.name}</b><small>{result.meta}</small><ArrowRight size={15} /></Link>)}</section></div>;
}
