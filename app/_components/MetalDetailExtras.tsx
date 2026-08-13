"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, LineChart } from "lucide-react";
import { formatCurrency } from "../../lib/country-data";

type Metal = "gold" | "silver";
type HistoryPoint = { date: string | number; value: number };
type NewsItem = { title: string; link: string; source: string; publishedAt: string };

function chartPoints(points: HistoryPoint[]) {
  if (points.length < 2) return "";
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 88 - ((value - min) / (max - min || 1)) * 72;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function MetalDetailExtras({ metal, ratePerGram, countryCode = "IN" }: { metal: Metal; ratePerGram: number; countryCode?: string }) {
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [weight, setWeight] = useState(metal === "gold" ? 10 : 100);
  const [making, setMaking] = useState(metal === "gold" ? 8 : 3);
  const metalLabel = metal === "gold" ? "Gold" : "Silver";
  const lineColor = metal === "gold" ? "#c9961a" : "#8a99ab";
  const plottedPoints = useMemo(() => chartPoints(points), [points]);
  const metalValue = weight * ratePerGram;
  const makingValue = metalValue * (making / 100);
  const gst = (metalValue + makingValue) * 0.03;

  useEffect(() => {
    const controller = new AbortController();

    async function loadExtras() {
      try {
        const [historyResponse, newsResponse] = await Promise.all([
          fetch(`/api/prices/history?metal=${metal}&period=7d&country=${countryCode}`, { signal: controller.signal }),
          fetch(`/api/news?country=${countryCode}`, { signal: controller.signal }),
        ]);

        if (historyResponse.ok) {
          const payload = (await historyResponse.json()) as { data: HistoryPoint[] };
          setPoints(payload.data);
        }

        if (newsResponse.ok) {
          const payload = (await newsResponse.json()) as { items: NewsItem[] };
          setNews(payload.items.filter((item) => item.title.toLowerCase().includes(metal)).slice(0, 4));
        }
      } catch {
        if (!controller.signal.aborted) {
          setPoints([]);
          setNews([]);
        }
      }
    }

    loadExtras();

    return () => controller.abort();
  }, [countryCode, metal]);

  return (
    <section className="metal-extras">
      <h2>{metalLabel} chart, calculator and latest news</h2>
      <p>Use these tools to understand current movement, estimate value, and follow related market headlines.</p>
      <div className="metal-extra-grid">
        <article className="metal-extra-card">
          <span>
            <LineChart size={18} /> 7-day {metalLabel.toLowerCase()} movement
          </span>
          {plottedPoints ? (
            <svg className="metal-mini-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={`${metalLabel} 7-day chart`} role="img">
              <polyline points={plottedPoints} fill="none" stroke={lineColor} strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>
          ) : (
            <div className="chart-empty">Chart data is temporarily unavailable.</div>
          )}
          <Link href={`/historical-prices?metal=${metal}`}>Open full historical prices</Link>
        </article>

        <article className="metal-extra-card">
          <span>
            <Calculator size={18} /> Quick {metalLabel.toLowerCase()} estimate
          </span>
          <label>
            Weight in grams
            <input type="number" min="0" value={weight} onChange={(event) => setWeight(Number(event.target.value))} />
          </label>
          <label>
            Making charge %
            <input type="number" min="0" value={making} onChange={(event) => setMaking(Number(event.target.value))} />
          </label>
          <strong>{formatCurrency(Math.round(metalValue + makingValue + gst), countryCode, 2)}</strong>
          <Link href="/calculator">Open full calculator</Link>
        </article>

        <article className="metal-extra-card metal-news-list">
          <span>Latest {metalLabel.toLowerCase()} news</span>
          {news.length ? (
            news.map((item) => (
              <a href={item.link} target="_blank" rel="noopener noreferrer" key={item.link}>
                <b>{item.title}</b>
                <small>{item.source}</small>
              </a>
            ))
          ) : (
            <p>Related market headlines are temporarily unavailable.</p>
          )}
        </article>
      </div>
    </section>
  );
}
