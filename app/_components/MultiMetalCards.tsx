"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { Bell, Eye, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "../../lib/country-data";
import { metals, mostSearchedMetalLinks, type MetalKey } from "../../lib/metals";
import type { MetalPrice } from "../../lib/metal-prices";

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
  const [payload, setPayload] = useState<MetalCurrentPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`/api/metals/current?city=${city}&country=${countryCode}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Metal API unavailable");
        setPayload((await response.json()) as MetalCurrentPayload);
        setError(false);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }

    void load();
    const timer = window.setInterval(load, 60000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [city, countryCode]);

  const rows = payload?.metals ?? [];

  return (
    <section className="wrap section investor-strip" aria-labelledby="multi-metal-title">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Investor dashboard</span>
          <h2 id="multi-metal-title">Today&apos;s most watched metal prices</h2>
          <p>Gold, silver, platinum and copper in one fast view. Unavailable feeds are never replaced with fake prices.</p>
        </div>
        <Link className="soft-link" href="/metal-comparison">
          Compare metals
        </Link>
      </div>
      {error ? <div className="inline-error">Multi-metal prices are temporarily unavailable.</div> : null}
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

export function WatchlistClient({ city = "mumbai", countryCode = "IN" }: { city?: string; countryCode?: string }) {
  const [watchlist, setWatchlist] = useState<MetalKey[]>(["gold", "silver"]);
  const [prices, setPrices] = useState<MetalPrice[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem("gsp-metal-watchlist-v1");
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved) as MetalKey[]);
      } catch {
        setWatchlist(["gold", "silver"]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("gsp-metal-watchlist-v1", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/metals/current?city=${city}&country=${countryCode}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: MetalCurrentPayload | null) => setPrices(payload?.metals ?? []))
      .catch(() => undefined);

    return () => controller.abort();
  }, [city, countryCode]);

  const selected = useMemo(() => prices.filter((price) => watchlist.includes(price.key)), [prices, watchlist]);

  return (
    <section className="wrap section watchlist-panel" aria-labelledby="watchlist-title">
      <div>
        <span className="eyebrow">My watchlist</span>
        <h2 id="watchlist-title">Track metals you care about</h2>
        <p>Saved only on this device. No login or database needed.</p>
      </div>
      <div className="watchlist-actions">
        {metals.map((metal) => (
          <label key={metal.key}>
            <input
              checked={watchlist.includes(metal.key)}
              onChange={(event) =>
                setWatchlist((current) =>
                  event.target.checked ? [...new Set([...current, metal.key])] : current.filter((item) => item !== metal.key),
                )
              }
              type="checkbox"
            />
            {metal.name}
          </label>
        ))}
      </div>
      <div className="watchlist-prices">
        {selected.length ? (
          selected.map((price) => (
            <Link href={price.route} key={price.key}>
              <Eye size={16} />
              <span>{price.name}</span>
              <strong>{formatMaybe(price.price, countryCode, price.key === "copper" ? 0 : 2)}</strong>
            </Link>
          ))
        ) : (
          <small>Select at least one metal to build your watchlist.</small>
        )}
      </div>
    </section>
  );
}

export function PriceAlertClient({ city = "mumbai" }: { city?: string }) {
  const [metal, setMetal] = useState<MetalKey>("gold");
  const [direction, setDirection] = useState<"above" | "below" | "movement">("below");
  const [targetPrice, setTargetPrice] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveAlert() {
    setBusy(true);
    setMessage("");
    try {
      if (!("serviceWorker" in navigator)) {
        setMessage("This browser does not support service workers.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setMessage("Turn on notifications first, then save a price alert.");
        return;
      }

      const response = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          metal,
          city,
          direction,
          targetPrice: direction === "movement" ? null : Number(targetPrice),
          movementPercent: direction === "movement" ? 1 : null,
        }),
      });

      if (!response.ok) throw new Error("Could not save alert");
      setMessage("Price alert saved. We will notify you when the condition is met.");
    } catch {
      setMessage("Could not save alert right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="wrap section alert-panel" aria-labelledby="price-alert-title">
      <div>
        <span className="eyebrow">Smart alerts</span>
        <h2 id="price-alert-title">Set a target price alert</h2>
        <p>Use push notifications for target prices or automatic 1% movement alerts.</p>
      </div>
      <div className="alert-form">
        <select value={metal} onChange={(event) => setMetal(event.target.value as MetalKey)} aria-label="Select metal">
          {metals.map((item) => (
            <option value={item.key} key={item.key}>
              {item.name}
            </option>
          ))}
        </select>
        <select value={direction} onChange={(event) => setDirection(event.target.value as "above" | "below" | "movement")} aria-label="Select alert type">
          <option value="below">Drops below</option>
          <option value="above">Rises above</option>
          <option value="movement">Moves 1%</option>
        </select>
        {direction !== "movement" ? (
          <input value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} inputMode="decimal" placeholder="Target price" aria-label="Target price" />
        ) : null}
        <button onClick={saveAlert} disabled={busy} type="button">
          <Bell size={16} />
          {busy ? "Saving..." : "Save alert"}
        </button>
      </div>
      {message ? <small className="form-message">{message}</small> : null}
    </section>
  );
}
