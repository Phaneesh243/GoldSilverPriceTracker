"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback } from "react";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "../../lib/country-data";
import { metals, mostSearchedMetalLinks } from "../../lib/metals";
import type { MetalPrice } from "../../lib/metal-prices";
import { useLiveRefresh } from "../_hooks/useLiveRefresh";

type MetalCurrentPayload = {
  countryCode: string;
  currency: string;
  metals: MetalPrice[];
};

function formatMaybe(value: number | null | undefined, countryCode: string, digits = 2) {
  return typeof value === "number" ? formatCurrency(value, countryCode, digits) : "Unavailable";
}

function movementText(metal: MetalPrice) {
  if (typeof metal.changePercentage !== "number") {
    return "Live";
  }

  if (Math.abs(metal.changePercentage) < 0.05) {
    return "Stable";
  }

  return `${metal.changePercentage > 0 ? "+" : ""}${metal.changePercentage.toFixed(2)}%`;
}

function signalFor(metal: MetalPrice) {
  if (metal.status !== "available") return "Unavailable";
  if (typeof metal.changePercentage !== "number") return "Live quote";
  if (metal.changePercentage <= -0.7) return "Buying watch";
  if (metal.changePercentage >= 0.7) return "Expensive zone";
  return "Neutral";
}

export function MultiMetalCards({ city = "mumbai", countryCode = "IN" }: { city?: string; countryCode?: string }) {
  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch(`/api/metals/current?city=${city}&country=${countryCode}`, { cache: "no-store", signal });
    if (!response.ok) throw new Error("The metal price provider is unavailable.");
    return response.json() as Promise<MetalCurrentPayload>;
  }, [city, countryCode]);
  const live = useLiveRefresh({ load, intervalMs: 5 * 60_000 });
  const payload = live.data;

  const rows = payload?.metals ?? [];

  return (
    <section className="wrap section investor-strip" aria-labelledby="multi-metal-title">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Investor dashboard</span>
          <h2 id="multi-metal-title">Today&apos;s most watched metal prices</h2>
          <p>Gold, silver, platinum and copper in one fast view. Unavailable feeds are never replaced with fake prices.</p>
        </div>
        <div className="section-heading-actions"><button className="soft-link" type="button" onClick={() => void live.refresh()} disabled={live.loading || live.refreshing}><RefreshCw size={15} />{live.refreshing ? "Refreshing…" : "Refresh"}</button><Link className="soft-link" href="/metal-comparison">Compare metals</Link></div>
      </div>
      {live.error ? <div className="inline-error">Provider unavailable: {live.error}</div> : null}
      <div className="metal-card-grid">
        {metals.map((config) => {
          const metal = rows.find((item) => item.key === config.key);
          const price = metal?.price ?? null;
          const positive = typeof metal?.changePercentage === "number" && metal.changePercentage >= 0;

          return (
            <Link className="metal-market-card" href={config.route} key={config.key} style={{ "--metal-color": config.color } as CSSProperties}>
              <span className="metal-symbol">{config.symbol}</span>
              <small>{config.name}</small>
              <strong>{metal ? formatMaybe(price, payload?.countryCode || countryCode, config.key === "copper" ? 0 : 2) : "Loading..."}</strong>
              <em>{config.unitLabel}</em>
              <span className={positive ? "metal-move up" : "metal-move down"}>
                {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {metal ? movementText(metal) : "Loading"}
              </span>
              <b>{metal ? signalFor(metal) : "Checking"}</b>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function MostSearchedMetalPrices() {
  return (
    <section className="wrap section compact-section" aria-labelledby="most-searched-title">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Most searched</span>
          <h2 id="most-searched-title">Most searched metal prices</h2>
        </div>
      </div>
      <div className="searched-grid">
        {mostSearchedMetalLinks.map((link) => (
          <Link className="searched-card" href={link.href} key={link.href}>
            <span>{link.label}</span>
            <small>{link.helper}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
