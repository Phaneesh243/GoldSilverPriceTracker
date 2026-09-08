"use client";
import Link from "next/link";
import { useState } from "react";
import type { MetalKey } from "../../lib/metals";
export default function MetalCalculator({ metal, price }: { metal: MetalKey; price: number | null; countryCode?: string }) {
  const [rate, setRate] = useState(""); const [weight, setWeight] = useState("");
  const valid = rate.trim() && weight.trim() && Number.isFinite(Number(rate)) && Number(rate) > 0 && Number(rate) <= 1e10 && Number.isFinite(Number(weight)) && Number(weight) >= 0 && Number(weight) <= 1e8 && Number(rate) * Number(weight) <= 1e15;
  return <section className="metals-workspace metals-quick-estimate"><h2>Quick value estimate</h2><p>Use your purity-specific quotation. Charges and taxes excluded.</p><div className="metals-fields"><label>Rate (INR per {metal === "copper" ? "kg" : "gram"})<input type="number" inputMode="decimal" min="0" step="any" placeholder="Enter your quoted rate" value={rate} onChange={e => setRate(e.target.value)} /></label><label>Weight ({metal === "copper" ? "kg" : "grams"})<input type="number" inputMode="decimal" min="0" step="any" placeholder={metal === "copper" ? "Enter weight in kg" : "Enter weight in grams"} value={weight} onChange={e => setWeight(e.target.value)} /></label></div>{typeof price === "number" ? <button onClick={() => setRate(String(price))}>Use displayed reference (verify purity)</button> : null}<p aria-live="polite">{valid ? "Metal value: ₹" + (Number(rate) * Number(weight)).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "Your estimate appears here once both fields are filled."}</p><Link href={"/calculators/" + metal}>Open complete calculator →</Link></section>;
}
