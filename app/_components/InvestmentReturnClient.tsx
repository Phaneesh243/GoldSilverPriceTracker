"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../../lib/country-data";
import { metals, type MetalKey } from "../../lib/metals";
import type { MetalPrice } from "../../lib/metal-prices";

type Payload = { countryCode: string; metals: MetalPrice[] };

export default function InvestmentReturnClient() {
  const [metal, setMetal] = useState<MetalKey>("gold");
  const [amount, setAmount] = useState("100000");
  const [buyPrice, setBuyPrice] = useState("");
  const [quantity, setQuantity] = useState("");
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

  const selected = prices.find((item) => item.key === metal);
  const currentPrice = selected?.price ?? 0;
  const manualBuyPrice = Number(buyPrice);
  const manualQuantity = Number(quantity);
  const investmentAmount = Number(amount);

  const result = useMemo(() => {
    if (!currentPrice || (!manualBuyPrice && !manualQuantity)) return null;
    const qty = manualQuantity || (manualBuyPrice ? investmentAmount / manualBuyPrice : 0);
    const cost = manualBuyPrice ? qty * manualBuyPrice : investmentAmount;
    const currentValue = qty * currentPrice;
    const profit = currentValue - cost;
    const profitPercent = cost ? (profit / cost) * 100 : 0;

    return { qty, cost, currentValue, profit, profitPercent };
  }, [currentPrice, investmentAmount, manualBuyPrice, manualQuantity]);

  return (
    <div className="tool-panel">
      <div className="tool-controls">
        <label>
          Metal
          <select value={metal} onChange={(event) => setMetal(event.target.value as MetalKey)}>
            {metals.map((item) => (
              <option value={item.key} key={item.key}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Investment amount
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
        </label>
        <label>
          Buy price
          <input value={buyPrice} onChange={(event) => setBuyPrice(event.target.value)} inputMode="decimal" placeholder="Manual buy price" />
        </label>
        <label>
          Quantity optional
          <input value={quantity} onChange={(event) => setQuantity(event.target.value)} inputMode="decimal" placeholder="Units bought" />
        </label>
      </div>
      <div className="calculator-result-card">
        <span>Current {selected?.unitLabel || "price"}</span>
        <strong>{currentPrice ? formatCurrency(currentPrice, countryCode, metal === "copper" ? 0 : 2) : "Unavailable"}</strong>
        {result ? (
          <>
            <p>
              Quantity: <b>{result.qty.toFixed(4)}</b>
            </p>
            <p>
              Current value: <b>{formatCurrency(result.currentValue, countryCode, 2)}</b>
            </p>
            <p>
              Profit/Loss: <b className={result.profit >= 0 ? "positive-text" : "negative-text"}>{formatCurrency(result.profit, countryCode, 2)} ({result.profitPercent.toFixed(2)}%)</b>
            </p>
          </>
        ) : (
          <p>Enter a buy price or quantity to estimate return. Historical auto-fill can be connected later when a reliable provider is available.</p>
        )}
        <small>Informational estimate only. Brokerage, GST, spreads and making charges are not included unless you add them separately.</small>
      </div>
    </div>
  );
}
