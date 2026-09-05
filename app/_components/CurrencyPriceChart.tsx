"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CurrencyPair } from "../../lib/currencies";
import { formatCurrencyRate } from "../../lib/currencies";

type Point = { date: string; close: number };
type Range = "1d" | "7d" | "30d" | "90d" | "1y";

const ranges: Array<{ value: Range; label: string }> = [
  { value: "1d", label: "1D" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "1M" },
  { value: "90d", label: "3M" },
  { value: "1y", label: "1Y" },
];

export default function CurrencyPriceChart({ pair, color = "#34d399" }: { pair: CurrencyPair; color?: string }) {
  const [range, setRange] = useState<Range>("30d");
  const [points, setPoints] = useState<Point[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/currencies/history?pair=${pair.slug}&period=${range}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { status?: string; data?: Point[] } | null) => {
        const next = payload?.data ?? [];
        setPoints(next);
        setStatus(payload?.status === "available" && next.length > 1 ? "ready" : "unavailable");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPoints([]);
          setStatus("unavailable");
        }
      });
    return () => controller.abort();
  }, [pair.slug, range]);

  const chartData = useMemo(() => points.map((point) => ({ ...point, label: new Date(`${point.date}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) })), [points]);
  const domain = useMemo<[number, number] | [string, string]>(() => {
    const values = points.map((point) => point.close).filter(Number.isFinite);
    if (!values.length) return ["auto", "auto"];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.12, max * 0.002);
    return [Math.max(0, min - padding), max + padding];
  }, [points]);

  return (
    <section className="currency-chart glass-panel" aria-labelledby={`${pair.slug}-chart-title`}>
      <div className="panel-head">
        <div>
          <span className="finance-eyebrow">Price movement</span>
          <h2 id={`${pair.slug}-chart-title`}>{pair.symbol} historical rate</h2>
        </div>
        <div className="range-tabs" role="group" aria-label="Currency chart range">
          {ranges.map((item) => <button className={range === item.value ? "active" : ""} key={item.value} onClick={() => setRange(item.value)} type="button">{item.label}</button>)}
        </div>
      </div>
      <div className="currency-chart-canvas">
        {status === "ready" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id={`${pair.slug}-gradient`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis domain={domain} tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} width={72} tickFormatter={(value) => Number(value).toLocaleString("en-IN", { maximumFractionDigits: 4 })} />
              <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--ink)" }} formatter={(value) => [formatCurrencyRate(Number(value), pair), pair.symbol]} />
              <Area dataKey="close" type="monotone" stroke={color} strokeWidth={3} fill={`url(#${pair.slug}-gradient)`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="chart-empty">{status === "loading" ? "Loading verified FX history..." : "Verified historical data is unavailable for this range."}</div>}
      </div>
      <p className="chart-caption">Reference rates are displayed with the provider&apos;s available frequency. No synthetic history is created.</p>
    </section>
  );
}
