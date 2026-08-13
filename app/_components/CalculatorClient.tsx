"use client";

import { useEffect, useMemo, useState } from "react";
import { countryOptions, formatCurrency } from "../../lib/country-data";
import { cityRates } from "../../lib/market-data";
import type { LivePricePayload } from "../../lib/live-prices";

type Metal = "gold" | "silver";
type Unit = "gram" | "10g" | "tola" | "kg";

const unitMultipliers: Record<Unit, number> = {
  gram: 1,
  "10g": 10,
  tola: 11.6638,
  kg: 1000,
};

function rateFor(payload: LivePricePayload | null, metal: Metal, purity: string) {
  if (!payload) return 0;
  if (metal === "silver") return payload.silver.pricePerGram;
  return payload.gold.find((item) => item.purity === purity)?.pricePerGram ?? payload.gold[0]?.pricePerGram ?? 0;
}

export default function CalculatorClient() {
  const [metal, setMetal] = useState<Metal>("gold");
  const [country, setCountry] = useState("IN");
  const [city, setCity] = useState("mumbai");
  const [purity, setPurity] = useState("22K");
  const [weight, setWeight] = useState(10);
  const [unit, setUnit] = useState<Unit>("gram");
  const [making, setMaking] = useState(8);
  const [gstPercent, setGstPercent] = useState(3);
  const [prices, setPrices] = useState<LivePricePayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const totalGrams = weight * unitMultipliers[unit];
  const perGramRate = rateFor(prices, metal, purity);
  const metalValue = totalGrams * perGramRate;
  const makingValue = metalValue * (making / 100);
  const gst = (metalValue + makingValue) * (gstPercent / 100);
  const total = metalValue + makingValue + gst;
  const selectedCity = useMemo(() => cityRates.find((item) => item.slug === city) ?? cityRates[0], [city]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPrices() {
      try {
        setStatus("loading");
        const response = await fetch(`/api/prices/current?city=${city}&country=${country}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Price unavailable");
        setPrices((await response.json()) as LivePricePayload);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) {
          setPrices(null);
          setStatus("error");
        }
      }
    }

    loadPrices();

    return () => controller.abort();
  }, [city, country]);

  function loadSample() {
    setMetal("gold");
    setCountry("IN");
    setCity("mumbai");
    setPurity("22K");
    setWeight(10);
    setUnit("gram");
    setMaking(8);
    setGstPercent(3);
  }

  function clear() {
    setWeight(0);
    setMaking(0);
    setGstPercent(3);
  }

  return (
    <section className="tool-panel calculator-tool">
      <div className="tool-tabs" role="tablist" aria-label="Calculator metal">
        <button className={metal === "gold" ? "active" : ""} type="button" onClick={() => setMetal("gold")}>
          Gold Calculator
        </button>
        <button className={metal === "silver" ? "active" : ""} type="button" onClick={() => setMetal("silver")}>
          Silver Calculator
        </button>
      </div>

      <div className="calculator-grid">
        <div className="calculator-form-card">
          <div className="tool-controls">
            <label>
              Country
              <select value={country} onChange={(event) => setCountry(event.target.value)}>
                {countryOptions.map((item) => (
                  <option value={item.code} key={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              City
              <select value={city} onChange={(event) => setCity(event.target.value)} disabled={country !== "IN"}>
                {cityRates.map((item) => (
                  <option value={item.slug} key={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Purity
              <select value={purity} onChange={(event) => setPurity(event.target.value)} disabled={metal === "silver"}>
                <option>24K</option>
                <option>22K</option>
                <option>18K</option>
              </select>
            </label>
            <label>
              Weight
              <input min="0" type="number" value={weight} onChange={(event) => setWeight(Number(event.target.value))} />
            </label>
            <label>
              Unit
              <select value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
                <option value="gram">Gram</option>
                <option value="10g">10 grams</option>
                <option value="tola">Tola</option>
                <option value="kg">Kilogram</option>
              </select>
            </label>
            <label>
              Making charge %
              <input min="0" type="number" value={making} onChange={(event) => setMaking(Number(event.target.value))} />
            </label>
            <label>
              GST %
              <input min="0" type="number" value={gstPercent} onChange={(event) => setGstPercent(Number(event.target.value))} />
            </label>
          </div>
          <div className="tool-actions">
            <button type="button" onClick={loadSample}>Sample calculation</button>
            <button type="button" onClick={clear}>Clear</button>
          </div>
        </div>

        <aside className="calculator-result-card">
          <span>{status === "loading" ? "Loading live rate..." : status === "error" ? "Live rate unavailable" : `${selectedCity.name} live rate`}</span>
          <strong>{perGramRate ? formatCurrency(perGramRate, country, metal === "silver" ? 2 : 0) : "Unavailable"} / gram</strong>
          <div className="breakdown">
            <span>
              Total weight <b>{totalGrams.toFixed(unit === "tola" ? 2 : 0)} g</b>
            </span>
            <span>
              Metal value <b>{formatCurrency(metalValue, country, 2)}</b>
            </span>
            <span>
              Making charge <b>{formatCurrency(makingValue, country, 2)}</b>
            </span>
            <span>
              GST <b>{formatCurrency(gst, country, 2)}</b>
            </span>
          </div>
          <div className="total">
            <span>Estimated total</span>
            <b>{formatCurrency(total, country, 2)}</b>
          </div>
          <p>This is only an estimate. Final jeweller invoices can include wastage, premiums, discounts, hallmark charges and local variation.</p>
        </aside>
      </div>
    </section>
  );
}
