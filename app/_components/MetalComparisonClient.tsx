"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../../lib/country-data";
import { metals, type MetalKey } from "../../lib/metals";
import type { MetalPrice } from "../../lib/metal-prices";

type Payload = { countryCode: string; metals: MetalPrice[] };

export default function MetalComparisonClient() {
  const [selected, setSelected] = useState<MetalKey[]>(["gold", "silver", "platinum"]);
  const [prices, setPrices] = useState<MetalPrice[]>([]);
  const [countryCode, setCountryCode] = useState("IN");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/metals/current?city=mumbai&country=IN", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: Payload | null) => {
        setPrices(payload?.metals ?? []);
        setCountryCode(payload?.countryCode ?? "IN");
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const selectedPrices = useMemo(() => prices.filter((price) => selected.includes(price.key)), [prices, selected]);
  const available = selectedPrices.filter((price) => typeof price.price === "number");
  const lowest = available.reduce<MetalPrice | null>((winner, current) => (!winner || (current.price ?? Infinity) < (winner.price ?? Infinity) ? current : winner), null);

  return (
    <div className="tool-panel comparison-tool">
      <div className="watchlist-actions">
        {metals.map((metal) => (
          <label key={metal.key}>
            <input
              checked={selected.includes(metal.key)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked ? [...new Set([...current, metal.key])] : current.filter((item) => item !== metal.key),
                )
              }
              type="checkbox"
            />
            {metal.name}
          </label>
        ))}
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Metal</th>
              <th>Current price</th>
              <th>Unit</th>
              <th>Change</th>
              <th>Investor note</th>
            </tr>
          </thead>
          <tbody>
            {selectedPrices.map((price) => {
              const config = metals.find((item) => item.key === price.key)!;
              return (
                <tr key={price.key}>
                  <td>{price.name}</td>
                  <td>{price.price ? formatCurrency(price.price, countryCode, price.key === "copper" ? 0 : 2) : "Unavailable"}</td>
                  <td>{price.unitLabel}</td>
                  <td>{typeof price.changePercentage === "number" ? `${price.changePercentage.toFixed(2)}%` : "Live quote"}</td>
                  <td>{config.investorUse}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="history-summary">
        <b>Quick insight</b>
        <p>
          {lowest
            ? `${lowest.name} has the lowest displayed unit price among your selected metals. Compare unit carefully: copper is shown per kg, while precious metals are shown per gram.`
            : "Select metals to compare current prices."}
        </p>
      </div>
    </div>
  );
}
