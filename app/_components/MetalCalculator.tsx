"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "../../lib/country-data";
import type { MetalKey } from "../../lib/metals";

export default function MetalCalculator({ metal, price, countryCode = "IN" }: { metal: MetalKey; price: number | null; countryCode?: string }) {
  const [weight, setWeight] = useState(metal === "copper" ? "1" : "10");
  const [premium, setPremium] = useState(metal === "gold" ? "8" : "3");
  const weightValue = Math.max(0, Number(weight) || 0);
  const premiumValue = Math.max(0, Number(premium) || 0);
  const result = useMemo(() => {
    if (typeof price !== "number") return null;
    const metalValue = price * weightValue;
    return { metalValue, total: metalValue * (1 + premiumValue / 100) };
  }, [premiumValue, price, weightValue]);
  const unit = metal === "copper" ? "kg" : "grams";

  return (
    <section className="metal-calculator" aria-labelledby={`${metal}-calculator-title`}>
      <div className="metal-section-heading">
        <div>
          <span>Quick estimate</span>
          <h2 id={`${metal}-calculator-title`}>{metal[0].toUpperCase() + metal.slice(1)} value calculator</h2>
        </div>
        <small>Informational estimate</small>
      </div>
      <div className="metal-calculator-grid">
        <label>
          Weight ({unit})
          <input inputMode="decimal" min="0" onChange={(event) => setWeight(event.target.value)} type="number" value={weight} />
        </label>
        <label>
          Premium / making charge %
          <input inputMode="decimal" min="0" onChange={(event) => setPremium(event.target.value)} type="number" value={premium} />
        </label>
        <div className="calculator-total">
          <small>Estimated value</small>
          <strong>{result ? formatCurrency(result.total, countryCode, metal === "copper" ? 0 : 2) : "Unavailable"}</strong>
          {result ? <span>Market value {formatCurrency(result.metalValue, countryCode, 2)} before premium</span> : <span>Live price is unavailable.</span>}
        </div>
      </div>
      <p className="chart-caption">Taxes, retailer margins, making charges, wastage, and buyback policies can change the final price.</p>
    </section>
  );
}
