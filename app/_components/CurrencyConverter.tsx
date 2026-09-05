"use client";

import { useEffect, useMemo, useState } from "react";
import { currencyDefinitions, getCurrencyPair, formatCurrencyRate, type CurrencyCode } from "../../lib/currencies";

export default function CurrencyConverter({ initialFrom = "USD", initialTo = "INR" }: { initialFrom?: CurrencyCode; initialTo?: CurrencyCode }) {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState<CurrencyCode>(initialFrom);
  const [to, setTo] = useState<CurrencyCode>(initialTo);
  const [rate, setRate] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const pair = useMemo(() => getCurrencyPair(`${from}-${to}`), [from, to]);

  useEffect(() => {
    if (from === to) return;
    const controller = new AbortController();
    fetch(`/api/currencies/current?pair=${from}-${to}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { rates?: Array<{ rate: number | null; timestamp: string | null }> } | null) => {
        const item = payload?.rates?.[0];
        setRate(item?.rate ?? null);
        setTimestamp(item?.timestamp ?? null);
        setStatus(item?.rate ? "ready" : "unavailable");
      })
      .catch(() => { if (!controller.signal.aborted) { setRate(null); setStatus("unavailable"); } });
    return () => controller.abort();
  }, [from, to]);

  const effectiveRate = from === to ? 1 : rate;
  const effectiveStatus = from === to ? "ready" : status;
  const converted = effectiveRate === null ? null : Math.max(0, Number(amount) || 0) * effectiveRate;

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <section className="currency-converter glass-panel">
      <div className="panel-head"><div><span className="finance-eyebrow">Reference conversion</span><h2>Currency converter</h2></div><span className="currency-status">{effectiveStatus === "loading" ? "Loading rate..." : effectiveStatus === "ready" ? "Live reference" : "Unavailable"}</span></div>
      <div className="currency-converter-form">
        <label>Amount<input min="0" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>
        <label>From<select value={from} onChange={(event) => setFrom(event.target.value as CurrencyCode)}>{currencyDefinitions.map((item) => <option value={item.code} key={item.code}>{item.code} — {item.name}</option>)}</select></label>
        <button className="currency-swap" type="button" onClick={swap} aria-label="Swap currencies">⇄</button>
        <label>To<select value={to} onChange={(event) => setTo(event.target.value as CurrencyCode)}>{currencyDefinitions.map((item) => <option value={item.code} key={item.code}>{item.code} — {item.name}</option>)}</select></label>
      </div>
      <div className="currency-converter-result">
        <span>{amount || 0} {from} equals</span>
        <strong>{converted === null ? "Unavailable" : `${converted.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${to}`}</strong>
        <small>{pair && effectiveRate !== null ? `1 ${from} = ${formatCurrencyRate(effectiveRate, pair)} ${to}` : "Choose a supported currency pair."}{timestamp ? ` · Rate date ${timestamp}` : ""}</small>
      </div>
      <p className="chart-caption">Reference mid-market rates may differ from bank, card, cash-exchange or remittance rates.</p>
    </section>
  );
}
