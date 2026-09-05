"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MetalKey } from "../../lib/metals";
import { formatCurrency } from "../../lib/country-data";

type Range = "1d" | "7d" | "10d" | "30d" | "1y";
type Point = { date: string | number; close: number; changePercentage?: number };

const ranges: Array<{ value: Range; label: string }> = [
  { value: "1d", label: "1D" },
  { value: "7d", label: "7D" },
  { value: "10d", label: "10D" },
  { value: "30d", label: "1M" },
  { value: "1y", label: "1Y" },
];

function displayDate(value: string | number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function MetalPriceChart({ metal, countryCode = "IN", color }: { metal: MetalKey; countryCode?: string; color: string }) {
  const [range, setRange] = useState<Range>("10d");
  const [points, setPoints] = useState<Point[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch(`/api/metals/history?metal=${metal}&period=${range}&country=${countryCode}`, { signal: controller.signal })
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
  }, [countryCode, metal, range]);

  const chartData = useMemo(
    () => points.map((point) => ({ ...point, label: displayDate(point.date) })),
    [points],
  );
  const yDomain = useMemo<[number, number] | [string, string]>(() => {
    if (!points.length) return ["auto", "auto"];
    const values = points.map((point) => point.close).filter(Number.isFinite);
    if (!values.length) return ["auto", "auto"];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.12, max * 0.005, 1);
    return [Math.max(0, min - padding), max + padding];
  }, [points]);
  const digits = metal === "copper" ? 0 : 2;

  return (
    <section className="metal-chart-section" aria-labelledby={`${metal}-chart-title`}>
      <div className="metal-section-heading chart-heading">
        <div>
          <span>Price movement</span>
          <h2 id={`${metal}-chart-title`}>Historical {metal} price chart</h2>
        </div>
        <div className="chart-range-tabs" role="group" aria-label="Chart range">
          {ranges.map((item) => (
            <button className={range === item.value ? "active" : ""} key={item.value} onClick={() => setRange(item.value)} type="button">
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="metal-chart-canvas">
        {status === "ready" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`${metal}-chart-gradient`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.34} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis
                allowDecimals={false}
                domain={yDomain}
                interval={0}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickCount={9}
                tickLine={false}
                axisLine={false}
                width={68}
                tickFormatter={(value) => Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              />
              <Tooltip
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--ink)" }}
                formatter={(value) => [formatCurrency(Number(value), countryCode, digits), "Price"]}
                labelFormatter={(label) => String(label)}
              />
              <Area dataKey="close" type="monotone" stroke={color} strokeWidth={3} fill={`url(#${metal}-chart-gradient)`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            {status === "loading" ? "Loading verified price history..." : "Verified historical data is unavailable for this range."}
          </div>
        )}
      </div>
      <p className="chart-caption">Prices are displayed with the provider&apos;s available frequency. No synthetic history is created.</p>
    </section>
  );
}
