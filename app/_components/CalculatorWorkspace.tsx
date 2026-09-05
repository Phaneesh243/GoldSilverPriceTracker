"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "../../lib/country-data";
import { getMetalConfig, metals, type MetalKey } from "../../lib/metals";
import type { MetalPrice } from "../../lib/metal-prices";
import {
  calculateCagr,
  calculateEmi,
  calculateInvestmentReturn,
  calculateMetal,
  calculateSip,
  calculateTax,
  convertWeight,
  getCalculatorTitle,
  purityFactors,
  type CalculatorKind,
  type CalculatorInputs,
  type WeightUnit,
} from "../../lib/calculators";

type MetalPayload = { countryCode: string; currency: string; metals: MetalPrice[] };
type SavedItem = { id: string; calculatorType: string; metal: string | null; result: Record<string, string | number | boolean | null>; createdAt: number };
type PresetItem = { id: string; name: string; calculatorType: string; inputs: Record<string, string | number | boolean | null>; createdAt: number };

const metalKinds: CalculatorKind[] = ["gold", "silver", "platinum", "copper", "gold-jewellery"];

function asNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ResultRow({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className={emphasis ? "calculator-result-row emphasis" : "calculator-result-row"}><span>{label}</span><b>{value}</b></div>;
}

function NumberField({ label, value, onChange, min = 0, step = "any", hint }: { label: string; value: string; onChange: (value: string) => void; min?: number; step?: string; hint?: string }) {
  return (
    <label className="calculator-field">
      <span>{label}</span>
      <input inputMode="decimal" min={min} step={step} type="number" value={value} onChange={(event) => onChange(event.target.value)} />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export default function CalculatorWorkspace({ kind }: { kind: CalculatorKind }) {
  const [prices, setPrices] = useState<MetalPrice[]>([]);
  const [countryCode] = useState("IN");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [presetName, setPresetName] = useState("");

  const [metal, setMetal] = useState<MetalKey>(metalKinds.includes(kind) ? (kind === "gold-jewellery" ? "gold" : kind) as MetalKey : "gold");
  const [purity, setPurity] = useState("22K");
  const [weight, setWeight] = useState("10");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(kind === "copper" ? "kg" : "gram");
  const [making, setMaking] = useState(kind === "gold-jewellery" ? "8" : "0");
  const [wastage, setWastage] = useState("0");
  const [tax, setTax] = useState("3");
  const [discount, setDiscount] = useState("0");
  const [fromPurity, setFromPurity] = useState("24K");
  const [toPurity, setToPurity] = useState("22K");
  const [fromWeightUnit, setFromWeightUnit] = useState<WeightUnit>("gram");
  const [toWeightUnit, setToWeightUnit] = useState<WeightUnit>("kg");
  const [investmentAmount, setInvestmentAmount] = useState("100000");
  const [buyPrice, setBuyPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [monthlyInvestment, setMonthlyInvestment] = useState("5000");
  const [annualReturn, setAnnualReturn] = useState("12");
  const [years, setYears] = useState("10");
  const [initialAmount, setInitialAmount] = useState("100000");
  const [finalAmount, setFinalAmount] = useState("180000");
  const [principal, setPrincipal] = useState("1000000");
  const [interest, setInterest] = useState("8.5");
  const [months, setMonths] = useState("60");
  const [currencyAmount, setCurrencyAmount] = useState("100");
  const [exchangeRate, setExchangeRate] = useState("83");
  const [taxableAmount, setTaxableAmount] = useState("100000");
  const [taxPercent, setTaxPercent] = useState("10");
  const [surchargePercent, setSurchargePercent] = useState("0");

  const needsPrices = metalKinds.includes(kind) || kind === "investment-return" || kind === "purity-converter";
  const priceMetal = kind === "gold-jewellery" ? "gold" : metal;

  useEffect(() => {
    if (!needsPrices) {
      setStatus("ready");
      return;
    }
    const controller = new AbortController();
    fetch("/api/metals/current?city=mumbai&country=IN", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: MetalPayload | null) => {
        setPrices(payload?.metals ?? []);
        setStatus(payload?.metals?.length ? "ready" : "error");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [needsPrices]);

  useEffect(() => {
    Promise.all([
      fetch("/api/storage/calculations").then((response) => (response.ok ? response.json() : null)),
      fetch("/api/storage/calculator-presets").then((response) => (response.ok ? response.json() : null)),
    ])
      .then(([calculationPayload, presetPayload]: [{ data?: SavedItem[] } | null, { data?: PresetItem[] } | null]) => {
        setSaved((calculationPayload?.data ?? []).filter((item) => item.calculatorType === kind).slice(0, 5));
        setPresets((presetPayload?.data ?? []).filter((item) => item.calculatorType === kind).slice(0, 5));
      })
      .catch(() => undefined);
  }, [kind]);

  const selectedPrice = prices.find((item) => item.key === priceMetal);
  const currentPrice = useMemo(() => {
    if (!selectedPrice) return 0;
    if (priceMetal === "gold" && selectedPrice.variants?.length) {
      const requestedPurity = kind === "purity-converter" ? "24K" : purity;
      return selectedPrice.variants.find((item) => item.label === requestedPurity)?.price ?? selectedPrice.price ?? 0;
    }
    return selectedPrice.price ?? 0;
  }, [kind, priceMetal, purity, selectedPrice]);
  const priceUnit = getMetalConfig(priceMetal).unit;

  const metalResult = useMemo(() => {
    if (!metalKinds.includes(kind)) return null;
    return calculateMetal({ price: currentPrice, priceUnit, weight: asNumber(weight), weightUnit, purityFactor: 1, makingPercent: asNumber(making), wastagePercent: asNumber(wastage), taxPercent: asNumber(tax), discount: asNumber(discount) });
  }, [currentPrice, discount, kind, making, priceUnit, tax, wastage, weight, weightUnit]);

  const investmentResult = useMemo(() => {
    if (kind !== "investment-return") return null;
    return calculateInvestmentReturn({ investmentAmount: asNumber(investmentAmount), buyPrice: asNumber(buyPrice), currentPrice, quantity: asNumber(quantity) });
  }, [buyPrice, currentPrice, investmentAmount, kind, quantity]);

  const purityResult = useMemo(() => {
    if (kind !== "purity-converter") return null;
    const amount = asNumber(weight);
    return { equivalentWeight: amount * purityFactors[fromPurity] / purityFactors[toPurity], valueAt24K: amount * currentPrice };
  }, [currentPrice, fromPurity, kind, toPurity, weight]);

  const conversionResult = useMemo(() => kind === "weight-converter" ? convertWeight(asNumber(weight), fromWeightUnit, toWeightUnit) : 0, [fromWeightUnit, kind, toWeightUnit, weight]);
  const sipResult = useMemo(() => kind === "sip" ? calculateSip({ monthlyInvestment: asNumber(monthlyInvestment), annualReturnPercent: asNumber(annualReturn), years: asNumber(years) }) : null, [annualReturn, kind, monthlyInvestment, years]);
  const cagrResult = useMemo(() => kind === "cagr" ? calculateCagr({ initial: asNumber(initialAmount), final: asNumber(finalAmount), years: asNumber(years) }) : null, [finalAmount, initialAmount, kind, years]);
  const emiResult = useMemo(() => kind === "emi" ? calculateEmi({ principal: asNumber(principal), annualInterestPercent: asNumber(interest), months: asNumber(months) }) : null, [interest, kind, months, principal]);
  const taxResult = useMemo(() => kind === "tax" ? calculateTax({ amount: asNumber(taxableAmount), taxPercent: asNumber(taxPercent), surchargePercent: asNumber(surchargePercent) }) : null, [surchargePercent, taxPercent, taxableAmount, kind]);
  const currencyResult = asNumber(currencyAmount) * asNumber(exchangeRate);

  function calculationPayload(): { inputs: CalculatorInputs; result: Record<string, string | number | boolean | null>; metal?: string } | null {
    if (metalResult) return { metal: priceMetal, inputs: { price: currentPrice, priceUnit, weight, weightUnit, purity, making, wastage, tax, discount }, result: metalResult };
    if (investmentResult) return { metal, inputs: { investmentAmount, buyPrice, quantity, currentPrice }, result: investmentResult };
    if (purityResult) return { metal: "gold", inputs: { weight, fromPurity, toPurity, currentPrice }, result: purityResult };
    if (kind === "weight-converter") return { inputs: { weight, fromWeightUnit, toWeightUnit }, result: { converted: conversionResult } };
    if (sipResult) return { inputs: { monthlyInvestment, annualReturn, years }, result: sipResult };
    if (cagrResult) return { inputs: { initialAmount, finalAmount, years }, result: cagrResult };
    if (emiResult) return { inputs: { principal, interest, months }, result: emiResult };
    if (taxResult) return { inputs: { taxableAmount, taxPercent, surchargePercent }, result: taxResult };
    if (kind === "currency") return { inputs: { currencyAmount, exchangeRate }, result: { converted: currencyResult } };
    return null;
  }

  async function saveCalculation() {
    const payload = calculationPayload();
    if (!payload) return;
    setMessage("Saving calculation...");
    const response = await fetch("/api/storage/calculations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ calculatorType: kind, ...payload, currency: "INR", city: "mumbai" }) });
    setMessage(response.ok ? "Calculation saved to your history." : "Sign in or try again to save this calculation.");
    if (response.ok) {
      const payloadResponse = (await response.json()) as { data?: SavedItem };
      if (payloadResponse.data) setSaved((current) => [payloadResponse.data!, ...current].slice(0, 5));
    }
  }

  async function savePreset() {
    const payload = calculationPayload();
    if (!payload || !presetName.trim()) {
      setMessage("Enter a name before saving a preset.");
      return;
    }
    setMessage("Saving preset...");
    const response = await fetch("/api/storage/calculator-presets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: presetName.trim(), calculatorType: kind, inputs: payload.inputs }) });
    if (!response.ok) {
      setMessage("Sign in or try again to save this preset.");
      return;
    }
    const payloadResponse = (await response.json()) as { data?: PresetItem };
    if (payloadResponse.data) setPresets((current) => [payloadResponse.data!, ...current].slice(0, 5));
    setPresetName("");
    setMessage("Preset saved.");
  }

  function applyPreset(inputs: Record<string, string | number | boolean | null>) {
    const value = (key: string) => inputs[key] === null || inputs[key] === undefined ? undefined : String(inputs[key]);
    if (value("weight")) setWeight(value("weight")!);
    if (value("weightUnit")) setWeightUnit(value("weightUnit") as WeightUnit);
    if (value("making")) setMaking(value("making")!);
    if (value("wastage")) setWastage(value("wastage")!);
    if (value("tax")) setTax(value("tax")!);
    if (value("discount")) setDiscount(value("discount")!);
    if (value("purity")) setPurity(value("purity")!);
    if (value("investmentAmount")) setInvestmentAmount(value("investmentAmount")!);
    if (value("buyPrice")) setBuyPrice(value("buyPrice")!);
    if (value("quantity")) setQuantity(value("quantity")!);
    if (value("monthlyInvestment")) setMonthlyInvestment(value("monthlyInvestment")!);
    if (value("annualReturn")) setAnnualReturn(value("annualReturn")!);
    if (value("years")) setYears(value("years")!);
    setMessage("Preset loaded.");
  }

  const title = getCalculatorTitle(kind);
  const isMetal = metalKinds.includes(kind);
  const canSave = Boolean(calculationPayload());

  return (
    <section className="calculator-module" aria-labelledby="calculator-workspace-title">
      <div className="calculator-module-intro">
        <div><span>Interactive calculator</span><h2 id="calculator-workspace-title">{title}</h2><p>Use live market data where available. Every result is an estimate and should be checked against your provider or final invoice.</p></div>
        {needsPrices ? <small className={status === "ready" ? "data-status ready" : "data-status"}>{status === "ready" ? "Live price connected" : status === "loading" ? "Loading live price" : "Live price unavailable"}</small> : null}
      </div>

      <div className="calculator-workspace-grid">
        <div className="calculator-form-panel">
          {isMetal ? (
            <>
              {kind === "gold-jewellery" ? null : <label className="calculator-field"><span>Metal</span><select value={metal} onChange={(event) => setMetal(event.target.value as MetalKey)}>{metals.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label>}
              {priceMetal === "gold" ? <label className="calculator-field"><span>Purity</span><select value={purity} onChange={(event) => setPurity(event.target.value)}><option>24K</option><option>22K</option><option>18K</option></select></label> : null}
              <NumberField label={`Weight (${priceUnit === "kg" ? "kg" : "grams"})`} value={weight} onChange={setWeight} />
              <label className="calculator-field"><span>Input unit</span><select value={weightUnit} onChange={(event) => setWeightUnit(event.target.value as WeightUnit)}>{Object.entries({ gram: "Gram", "10g": "10 grams", kg: "Kilogram", tola: "Tola", oz: "Troy/regular ounce", lb: "Pound", tonne: "Tonne" }).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              {kind === "gold-jewellery" ? <><NumberField label="Making charge %" value={making} onChange={setMaking} /><NumberField label="Wastage %" value={wastage} onChange={setWastage} /><NumberField label="GST / tax %" value={tax} onChange={setTax} /><NumberField label="Discount" value={discount} onChange={setDiscount} /></> : null}
            </>
          ) : null}

          {kind === "purity-converter" ? <><NumberField label="Weight in grams" value={weight} onChange={setWeight} /><label className="calculator-field"><span>From purity</span><select value={fromPurity} onChange={(event) => setFromPurity(event.target.value)}><option>24K</option><option>22K</option><option>18K</option></select></label><label className="calculator-field"><span>To purity</span><select value={toPurity} onChange={(event) => setToPurity(event.target.value)}><option>24K</option><option>22K</option><option>18K</option></select></label></> : null}
          {kind === "weight-converter" ? <><NumberField label="Amount" value={weight} onChange={setWeight} /><label className="calculator-field"><span>From unit</span><select value={fromWeightUnit} onChange={(event) => setFromWeightUnit(event.target.value as WeightUnit)}>{Object.keys({ gram: 1, "10g": 1, kg: 1, tola: 1, oz: 1, lb: 1, tonne: 1 }).map((value) => <option value={value} key={value}>{value}</option>)}</select></label><label className="calculator-field"><span>To unit</span><select value={toWeightUnit} onChange={(event) => setToWeightUnit(event.target.value as WeightUnit)}>{Object.keys({ gram: 1, "10g": 1, kg: 1, tola: 1, oz: 1, lb: 1, tonne: 1 }).map((value) => <option value={value} key={value}>{value}</option>)}</select></label></> : null}
          {kind === "investment-return" ? <><label className="calculator-field"><span>Metal</span><select value={metal} onChange={(event) => setMetal(event.target.value as MetalKey)}>{metals.map((item) => <option value={item.key} key={item.key}>{item.name}</option>)}</select></label><NumberField label="Investment amount" value={investmentAmount} onChange={setInvestmentAmount} /><NumberField label="Buy price" value={buyPrice} onChange={setBuyPrice} hint="Optional when quantity is entered" /><NumberField label="Quantity" value={quantity} onChange={setQuantity} hint="Optional when investment amount is entered" /></> : null}
          {kind === "sip" ? <><NumberField label="Monthly investment" value={monthlyInvestment} onChange={setMonthlyInvestment} /><NumberField label="Expected annual return %" value={annualReturn} onChange={setAnnualReturn} /><NumberField label="Duration in years" value={years} onChange={setYears} /></> : null}
          {kind === "cagr" ? <><NumberField label="Initial value" value={initialAmount} onChange={setInitialAmount} /><NumberField label="Final value" value={finalAmount} onChange={setFinalAmount} /><NumberField label="Duration in years" value={years} onChange={setYears} /></> : null}
          {kind === "emi" ? <><NumberField label="Loan principal" value={principal} onChange={setPrincipal} /><NumberField label="Annual interest %" value={interest} onChange={setInterest} /><NumberField label="Tenure in months" value={months} onChange={setMonths} /></> : null}
          {kind === "currency" ? <><NumberField label="Amount" value={currencyAmount} onChange={setCurrencyAmount} /><NumberField label="Reference rate to INR" value={exchangeRate} onChange={setExchangeRate} hint="Replace with the current provider rate" /></> : null}
          {kind === "tax" ? <><NumberField label="Taxable amount" value={taxableAmount} onChange={setTaxableAmount} /><NumberField label="Tax %" value={taxPercent} onChange={setTaxPercent} /><NumberField label="Surcharge %" value={surchargePercent} onChange={setSurchargePercent} /></> : null}
          <div className="calculator-form-actions"><button className="primary-button" disabled={!canSave} onClick={() => void saveCalculation()} type="button">Save calculation</button><button className="outline-button" onClick={() => setMessage("")} type="button">Clear message</button></div>
          <div className="calculator-preset-actions"><input aria-label="Preset name" placeholder="Preset name" value={presetName} onChange={(event) => setPresetName(event.target.value)} /><button className="outline-button" disabled={!canSave} onClick={() => void savePreset()} type="button">Save preset</button></div>
          {message ? <small className="calculator-message">{message}</small> : null}
        </div>

        <aside className="calculator-result-panel">
          <span>Estimated result</span>
          {metalResult ? <><h3>{formatCurrency(metalResult.total, countryCode, 2)}</h3><ResultRow label="Market value" value={formatCurrency(metalResult.marketValue, countryCode, 2)} /><ResultRow label="Making charge" value={formatCurrency(metalResult.makingCharge, countryCode, 2)} /><ResultRow label="Wastage" value={formatCurrency(metalResult.wastageValue, countryCode, 2)} /><ResultRow label="Tax" value={formatCurrency(metalResult.tax, countryCode, 2)} /><ResultRow label="Discount" value={formatCurrency(metalResult.discount, countryCode, 2)} /></> : null}
          {investmentResult ? <><h3>{formatCurrency(investmentResult.currentValue, countryCode, 2)}</h3><ResultRow label="Quantity" value={investmentResult.quantity.toFixed(6)} /><ResultRow label="Profit / loss" value={`${formatCurrency(investmentResult.profit, countryCode, 2)} (${investmentResult.profitPercent.toFixed(2)}%)`} emphasis /></> : null}
          {purityResult ? <><h3>{purityResult.equivalentWeight.toFixed(4)} g</h3><ResultRow label="Reference 24K value" value={formatCurrency(purityResult.valueAt24K, countryCode, 2)} /></> : null}
          {kind === "weight-converter" ? <><h3>{conversionResult.toFixed(6)}</h3><ResultRow label="Conversion" value={`${weight} ${fromWeightUnit} → ${toWeightUnit}`} /></> : null}
          {sipResult ? <><h3>{formatCurrency(sipResult.futureValue, countryCode, 2)}</h3><ResultRow label="Invested" value={formatCurrency(sipResult.invested, countryCode, 2)} /><ResultRow label="Estimated gains" value={formatCurrency(sipResult.gains, countryCode, 2)} emphasis /></> : null}
          {cagrResult ? <><h3>{cagrResult.cagr.toFixed(2)}%</h3><ResultRow label="Absolute gain" value={formatCurrency(cagrResult.gain, countryCode, 2)} /></> : null}
          {emiResult ? <><h3>{formatCurrency(emiResult.payment, countryCode, 2)} / month</h3><ResultRow label="Total payment" value={formatCurrency(emiResult.totalPayment, countryCode, 2)} /><ResultRow label="Total interest" value={formatCurrency(emiResult.totalInterest, countryCode, 2)} /></> : null}
          {kind === "currency" ? <><h3>{formatCurrency(currencyResult, countryCode, 2)}</h3><ResultRow label="Applied rate" value={`1 × ${exchangeRate} INR`} /></> : null}
          {taxResult ? <><h3>{formatCurrency(taxResult.afterTax, countryCode, 2)}</h3><ResultRow label="Total tax" value={formatCurrency(taxResult.totalTax, countryCode, 2)} /><ResultRow label="Surcharge" value={formatCurrency(taxResult.surcharge, countryCode, 2)} /></> : null}
          {!metalResult && !investmentResult && !purityResult && kind !== "weight-converter" && !sipResult && !cagrResult && !emiResult && kind !== "currency" && !taxResult ? <h3>Enter values to calculate</h3> : null}
          <p>Informational estimate only. Rates, taxes, spreads, fees, and retailer charges may change the final result.</p>
        </aside>
      </div>

      {saved.length ? <section className="calculator-saved-panel"><div><span>Saved history</span><h3>Recent calculations</h3></div>{saved.map((item) => <div className="saved-calculation-row" key={item.id}><b>{item.metal || item.calculatorType}</b><small>{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small><Link href="#calculator-workspace-title">View result</Link></div>)}</section> : null}
      {presets.length ? <section className="calculator-saved-panel"><div><span>Saved presets</span><h3>Reuse your inputs</h3></div>{presets.map((item) => <div className="saved-calculation-row" key={item.id}><b>{item.name}</b><small>{new Date(item.createdAt).toLocaleDateString("en-IN")}</small><button className="text-button" onClick={() => applyPreset(item.inputs)} type="button">Load preset</button></div>)}</section> : null}
    </section>
  );
}
