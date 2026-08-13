"use client";

import { useEffect, useMemo, useState } from "react";
import { countryOptions, formatCurrency } from "../../lib/country-data";
import { cityRates } from "../../lib/market-data";

type Metal = "gold" | "silver";
type HistoryPoint = { date: string | number; value: number };

const rangeOptions = [
  { label: "1 Day", value: "1d" },
  { label: "7 Days", value: "7d" },
  { label: "1 Month", value: "1m" },
  { label: "6 Months", value: "6m" },
  { label: "1 Year", value: "1y" },
];

function formatDate(value: string | number) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(numeric > 1_000_000_000_000 ? numeric : numeric * 1000));
  }

  return String(value);
}

function chartPath(points: HistoryPoint[]) {
  if (points.length < 2) return { line: "", area: "" };

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const line = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 88 - ((value - min) / (max - min || 1)) * 72;
      return `${x},${y}`;
    })
    .join(" ");

  return { line, area: `0,94 ${line} 100,94` };
}

export default function HistoricalPricesClient() {
  const [metal, setMetal] = useState<Metal>("gold");
  const [country, setCountry] = useState("IN");
  const [city, setCity] = useState("mumbai");
  const [purity, setPurity] = useState("24K");
  const [range, setRange] = useState("7d");
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const chart = useMemo(() => chartPath(points), [points]);
  const values = points.map((point) => point.value);
  const opening = values[0] ?? 0;
  const current = values.at(-1) ?? 0;
  const high = values.length ? Math.max(...values) : 0;
  const low = values.length ? Math.min(...values) : 0;
  const change = current - opening;
  const changePercent = opening ? (change / opening) * 100 : 0;
  const color = metal === "gold" ? "#c9961a" : "#8a99ab";

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        setStatus("loading");
        const response = await fetch(`/api/prices/history?metal=${metal}&period=${range}&country=${country}&city=${city}&purity=${purity}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("History unavailable");

        const payload = (await response.json()) as { data: HistoryPoint[] };
        setPoints(payload.data);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) {
          setPoints([]);
          setStatus("error");
        }
      }
    }

    loadHistory();

    return () => controller.abort();
  }, [city, country, metal, purity, range]);

  return (
    <section className="tool-panel">
      <div className="tool-controls">
        <label>
          Metal
          <select value={metal} onChange={(event) => setMetal(event.target.value as Metal)}>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
          </select>
        </label>
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
      </div>

      <div className="tool-tabs" role="group" aria-label="Historical price range">
        {rangeOptions.map((item) => (
          <button className={range === item.value ? "active" : ""} type="button" onClick={() => setRange(item.value)} key={item.value}>
            {item.label}
          </button>
        ))}
      </div>

      {status === "error" ? <div className="inline-error">Historical prices are temporarily unavailable. Please try again shortly.</div> : null}

      <div className="history-layout">
        <article className="history-chart-card">
          <div className="tool-card-heading">
            <span>{metal === "gold" ? `${purity} gold` : "Silver"} price movement</span>
            <b className={change >= 0 ? "positive-text" : "negative-text"}>
              {change >= 0 ? "+" : ""}
              {changePercent.toFixed(2)}%
            </b>
          </div>
          {status === "loading" ? (
            <div className="chart-empty">Loading chart...</div>
          ) : chart.line ? (
            <svg className="history-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Historical price chart">
              <defs>
                <linearGradient id="historyFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.32" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <line className="spark-grid" x1="0" x2="100" y1="28" y2="28" />
              <line className="spark-grid" x1="0" x2="100" y1="58" y2="58" />
              <line className="spark-grid" x1="0" x2="100" y1="88" y2="88" />
              <polygon points={chart.area} fill="url(#historyFill)" />
              <polyline points={chart.line} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>
          ) : (
            <div className="chart-empty">Not enough chart data for this range.</div>
          )}
        </article>

        <aside className="history-summary">
          {[
            ["Opening", opening],
            ["Current", current],
            ["High", high],
            ["Low", low],
          ].map(([label, value]) => (
            <span key={label as string}>
              {label as string}
              <b>{formatCurrency(Number(value), country, 2)}</b>
            </span>
          ))}
        </aside>
      </div>

      <div className="responsive-table">
        <div className="history-row history-head">
          <span>Date</span>
          <span>Price</span>
          <span>Change</span>
        </div>
        {points.map((point, index) => {
          const previous = points[index - 1]?.value ?? point.value;
          const rowChange = point.value - previous;

          return (
            <div className="history-row" key={`${point.date}-${index}`}>
              <span>{formatDate(point.date)}</span>
              <b>{formatCurrency(point.value, country, 2)}</b>
              <em className={rowChange >= 0 ? "positive-text" : "negative-text"}>
                {rowChange >= 0 ? "+" : ""}
                {formatCurrency(rowChange, country, 2)}
              </em>
            </div>
          );
        })}
      </div>
    </section>
  );
}
