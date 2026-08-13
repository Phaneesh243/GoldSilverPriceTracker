"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import type { PointerEvent } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Calculator,
  ChevronRight,
  Coins,
  LineChart,
  MapPin,
} from "lucide-react";
import ConsentPrompt from "./_components/ConsentPrompt";
import SiteHeader from "./_components/SiteHeader";
import { formatCurrency, getCountry } from "../lib/country-data";
import { cityRates } from "../lib/market-data";
import type { LivePricePayload } from "../lib/live-prices";

const ranges = ["1D", "7D", "1M", "6M", "1Y"];
const majorCityOrder = ["chennai", "mumbai", "delhi", "kolkata", "bengaluru", "hyderabad", "kerala", "pune", "vadodara", "ahmedabad"];
type HistoryPoint = { date: string | number; value: number };
type NewsImageHint = "gold-bars" | "silver-coins" | "market-chart" | "jewelry" | "city-rates" | "bullion";
type NewsItem = { title: string; link: string; source: string; publishedAt: string; imageUrl?: string; imageHint?: NewsImageHint };
type GoldRate = NonNullable<LivePricePayload["gold"][number]>;
type SilverRate = LivePricePayload["silver"];
type CityGoldRow = {
  slug: string;
  city: string;
  gold24: number;
  gold22: number;
  gold18: number;
  updatedAt?: string;
  source?: string;
};

const newsImagePool: Array<{
  src: string;
  alt: string;
  hints: NewsImageHint[];
}> = [
  { src: "/news/gold-bars-01.jpg", alt: "Gold bullion bars stacked in warm light", hints: ["gold-bars", "bullion"] },
  { src: "/news/gold-bullion-02.jpg", alt: "Close view of investment gold bullion", hints: ["gold-bars", "bullion"] },
  { src: "/news/silver-coins-03.jpg", alt: "Silver and gold bullion coins on a dark table", hints: ["silver-coins", "bullion"] },
  { src: "/news/gold-jewellery-04.jpg", alt: "Gold jewellery display for retail market news", hints: ["jewelry", "city-rates"] },
  { src: "/news/market-chart-05.jpg", alt: "Financial market chart for gold and silver movement", hints: ["market-chart"] },
  { src: "/news/gold-coins-06.jpg", alt: "Gold coins used for bullion investment news", hints: ["gold-bars", "bullion"] },
  { src: "/news/silver-bars-07.jpg", alt: "Silver bullion coins and bars", hints: ["silver-coins", "bullion"] },
  { src: "/news/gold-rings-08.jpg", alt: "Gold jewellery rings for buying and retail headlines", hints: ["jewelry"] },
  { src: "/news/trading-screen-09.jpg", alt: "Trading chart screen for precious metal market updates", hints: ["market-chart"] },
  { src: "/news/precious-metals-10.jpg", alt: "Precious metal bars and coins for bullion headlines", hints: ["gold-bars", "silver-coins", "bullion", "city-rates"] },
];

function formatChartDate(value: HistoryPoint["date"]) {
  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    const date = new Date(numeric > 1_000_000_000_000 ? numeric : numeric * 1000);

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(date);
  }

  return String(value);
}

function Spark({ points, color, countryCode }: { points: HistoryPoint[]; color: string; countryCode: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (points.length < 2) {
    return <div className="chart-empty">Live chart data is loading.</div>;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const plottedPoints = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 88 - ((value - min) / (max - min || 1)) * 72;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,94 ${plottedPoints} 100,94`;
  const gradientId = `spark-${countryCode}-${color.replace(/[^a-z0-9]/gi, "")}`;
  const activePoint = activeIndex === null ? null : points[activeIndex];
  const activeX = activeIndex === null ? 0 : (activeIndex / (values.length - 1)) * 100;
  const activeY = activePoint ? 88 - ((activePoint.value - min) / (max - min || 1)) * 72 : 0;
  const latestX = 100;
  const latestY = 88 - ((values.at(-1)! - min) / (max - min || 1)) * 72;

  function updateActivePoint(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setActiveIndex(Math.round(ratio * (points.length - 1)));
  }

  return (
    <div
      className="spark-wrap"
      onPointerMove={updateActivePoint}
      onPointerLeave={() => setActiveIndex(null)}
      onFocus={() => setActiveIndex(Math.round((points.length - 1) / 2))}
      onBlur={() => setActiveIndex(null)}
      tabIndex={0}
      role="img"
      aria-label="Interactive price chart"
    >
      <svg className="spark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.34" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line className="spark-grid" x1="0" x2="100" y1="26" y2="26" />
        <line className="spark-grid" x1="0" x2="100" y1="58" y2="58" />
        <line className="spark-grid" x1="0" x2="100" y1="90" y2="90" />
        <polygon className="spark-area" points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline className="spark-line" points={plottedPoints} fill="none" stroke={color} strokeWidth="2.8" vectorEffect="non-scaling-stroke" />
        <circle className="spark-latest" cx={latestX} cy={latestY} r="2.8" fill={color} />
        {activePoint ? (
          <>
            <line className="spark-guide" x1={activeX} x2={activeX} y1="8" y2="92" />
            <circle className="spark-point" cx={activeX} cy={activeY} r="2.4" fill={color} />
          </>
        ) : null}
      </svg>
      {activePoint ? (
        <div className="chart-tooltip" style={{ left: `${activeX}%`, top: `${activeY}%` }}>
          <b>{formatCurrency(activePoint.value, countryCode, 2)}</b>
          <span>{formatChartDate(activePoint.date)}</span>
        </div>
      ) : null}
    </div>
  );
}

function Heading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

function Chart({ type, range, setRange, countryCode }: { type: "gold" | "silver"; range: string; setRange: (value: string) => void; countryCode: string }) {
  const isGold = type === "gold";
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        setStatus("loading");
        const response = await fetch(`/api/prices/history?metal=${type}&period=${range.toLowerCase()}&country=${countryCode}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("History unavailable");
        }

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
  }, [countryCode, range, type]);

  const values = points.map((point) => point.value);
  const first = values[0];
  const last = values.at(-1);
  const changePercent = first && last ? ((last - first) / first) * 100 : 0;
  const high = values.length ? Math.max(...values) : 0;
  const low = values.length ? Math.min(...values) : 0;
  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  return (
    <article className="chart">
      <div className="chart-title">
        <div>
          <h3>{isGold ? "Gold movement" : "Silver movement"}</h3>
          <small>{isGold ? "24K daily rate per gram" : "Silver daily rate per gram"}</small>
        </div>
        <span>{status === "ready" ? `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%` : "Live"}</span>
      </div>
      <div className="ranges" role="group" aria-label={`${type} chart range`}>
        {ranges.map((item) => (
          <button className={range === item ? "selected" : ""} onClick={() => setRange(item)} key={item}>
            {item}
          </button>
        ))}
      </div>
      <div className="chart-area">
        {status === "error" ? <div className="chart-empty">Live chart is temporarily unavailable.</div> : <Spark points={points} color={isGold ? "#c9961a" : "#8593a3"} countryCode={countryCode} />}
        {status === "ready" && last ? (
          <div className="chart-stats" aria-label={`${type} chart summary`}>
            <span>
              Current
              <b>{formatCurrency(last, countryCode, 2)}</b>
            </span>
            <span>
              High
              <b>{formatCurrency(high, countryCode, 2)}</b>
            </span>
            <span>
              Low
              <b>{formatCurrency(low, countryCode, 2)}</b>
            </span>
          </div>
        ) : null}
        <div className="chart-labels">
          <small>{firstPoint ? formatChartDate(firstPoint.date) : "Start"}</small>
          <small>{points.length ? `${points.length} points` : "Loading"}</small>
          <small>{lastPoint ? formatChartDate(lastPoint.date) : "Latest"}</small>
        </div>
      </div>
    </article>
  );
}

function CalculatorPreview({ ratePerGram, countryCode }: { ratePerGram: number; countryCode: string }) {
  const [weight, setWeight] = useState(10);
  const [making, setMaking] = useState(8);
  const metalValue = weight * ratePerGram;
  const makingValue = metalValue * (making / 100);
  const gst = (metalValue + makingValue) * 0.03;

  return (
    <section className="calculator-band" id="calculator">
      <div className="wrap calc-layout">
        <div className="calc-copy">
          <span className="eyebrow">Quick estimate</span>
          <h2>Check jewellery value before you visit a shop.</h2>
          <p>Uses the live 22K city rate, making charge, and 3% GST. Treat this as a planning estimate.</p>
          <Link href="/calculator" className="outline">
            Full calculator <ChevronRight size={15} />
          </Link>
        </div>
        <div className="calc-box">
          <div className="forms">
            <label>
              Weight
              <input min="0" type="number" value={weight} onChange={(event) => setWeight(Number(event.target.value))} />
              <i>grams</i>
            </label>
            <label>
              Making charge
              <input min="0" type="number" value={making} onChange={(event) => setMaking(Number(event.target.value))} />
              <i>%</i>
            </label>
          </div>
          <div className="breakdown">
            <span>
              Metal value <b>{formatCurrency(metalValue, countryCode, 2)}</b>
            </span>
            <span>
              GST <b>{formatCurrency(gst, countryCode, 2)}</b>
            </span>
          </div>
          <div className="total">
            <span>Estimated total</span>
            <b>{formatCurrency(Math.round(metalValue + makingValue + gst), countryCode, 2)}</b>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickTools() {
  return (
    <section className="wrap section quick-tools-top">
      <Heading eyebrow="Explore first" title="Useful tools" copy="Jump directly to the most-used gold, silver, history and calculator pages." />
      <div className="quick">
        {[
          [Coins, "Gold price today", "24K, 22K and 18K rates", "/gold-price-today"],
          [Coins, "Silver price today", "Gram, 10g and kilogram rates", "/silver-price-today"],
          [LineChart, "Historical prices", "Filter by city, purity and range", "/historical-prices"],
          [Calculator, "Calculator", "Estimate final jewellery value", "/calculator"],
        ].map(([Icon, title, desc, href]) => (
          <Link className="quick-card" href={href as string} key={title as string}>
            <span>
              <Icon size={18} />
            </span>
            <b>
              {title as string}
              <small>{desc as string}</small>
            </b>
            <ChevronRight size={15} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function newsHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function inferNewsHint(item: NewsItem): NewsImageHint {
  const text = `${item.title} ${item.source}`.toLowerCase();

  if (/silver|xag|999/.test(text)) return "silver-coins";
  if (/chart|prediction|forecast|outlook|trend|rises|falls|volatility|market|mcx/.test(text)) return "market-chart";
  if (/jewel|jewellery|jewelry|ornament|retail|buyer|buying|wedding/.test(text)) return "jewelry";
  if (/delhi|mumbai|kolkata|chennai|bengaluru|bangalore|hyderabad|city|cities|maharashtra|india/.test(text)) return "city-rates";
  if (/bullion|bar|bars|reserve|spot/.test(text)) return "bullion";

  return "gold-bars";
}

function newsLabel(hint: NewsImageHint) {
  const labels: Record<NewsImageHint, string> = {
    "gold-bars": "Gold",
    "silver-coins": "Silver",
    "market-chart": "Market",
    jewelry: "Jewellery",
    "city-rates": "City rates",
    bullion: "Bullion",
  };

  return labels[hint];
}

function imageForNews(item: NewsItem, index: number) {
  const hint = item.imageHint || inferNewsHint(item);
  const relevantImages = newsImagePool.filter((image) => image.hints.includes(hint));
  const sourceImages = relevantImages.length > 0 ? relevantImages : newsImagePool;
  const seed = newsHash(`${item.title}-${item.source}-${hint}`);
  const image = sourceImages[(seed + index) % sourceImages.length];

  return { hint, image };
}

function NewsSection({ countryCode }: { countryCode: string }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      try {
        setStatus("loading");
        const response = await fetch(`/api/news?country=${countryCode}`, { signal: controller.signal });

        if (!response.ok) {
          throw new Error("News unavailable");
        }

        const payload = (await response.json()) as { items: NewsItem[] };
        setItems(payload.items);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) {
          setItems([]);
          setStatus("error");
        }
      }
    }

    loadNews();

    return () => controller.abort();
  }, [countryCode]);

  return (
    <section className="wrap section">
      <Heading eyebrow="Market news" title="Gold and silver news" copy="Fresh headlines related to bullion, jewellery, gold, and silver prices." />
      {status === "error" ? <div className="inline-error">News is temporarily unavailable. Please check again shortly.</div> : null}
      <div className="news-grid">
        {status === "loading"
          ? Array.from({ length: 3 }).map((_, index) => (
              <article className="news-card loading-news" key={index}>
                <div className="news-image shimmer">
                  <span>GSP</span>
                </div>
                <div className="news-content">
                  <span>Loading</span>
                  <strong>Fetching market headline...</strong>
                  <small>GoldSilverPrices</small>
                </div>
              </article>
            ))
          : items.slice(0, 6).map((item, index) => {
              const visual = imageForNews(item, index);

              return (
              <a className="news-card" href={item.link} target="_blank" rel="noopener noreferrer" key={item.link}>
                <div className="news-image">
                  <Image
                    src={visual.image.src}
                    alt={visual.image.alt}
                    fill
                    sizes="(max-width: 760px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="news-photo"
                  />
                  <i>{newsLabel(visual.hint)}</i>
                </div>
                <div className="news-content">
                  <span>{item.source}</span>
                  <strong>{item.title}</strong>
                  <small>{item.publishedAt ? new Date(item.publishedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Latest"}</small>
                </div>
              </a>
              );
            })}
      </div>
    </section>
  );
}

function formatSignedAmount(value: number, countryCode: string) {
  const sign = value >= 0 ? "+" : "-";

  return `${sign}${formatCurrency(Math.abs(value), countryCode, 0)}`;
}

function CompactRateCards({
  gold24,
  gold22,
  gold18,
  silver,
  countryCode,
}: {
  gold24: GoldRate | null;
  gold22: GoldRate | null;
  gold18: GoldRate | null;
  silver: SilverRate | null;
  countryCode: string;
}) {
  const cards = [
    { label: "24K Gold /g", rate: gold24?.pricePerGram, change: gold24?.changeAmount, href: "/gold-price-today" },
    { label: "22K Gold /g", rate: gold22?.pricePerGram, change: gold22?.changeAmount, href: "/gold-price-today" },
    { label: "18K Gold /g", rate: gold18?.pricePerGram, change: gold18?.changeAmount, href: "/gold-price-today" },
    { label: "Silver /g", rate: silver?.pricePerGram, change: silver?.changeAmount, href: "/silver-price-today" },
  ];

  return (
    <div className="compact-rate-grid" aria-label="Quick gold and silver price cards">
      {cards.map((card) => {
        const down = (card.change ?? 0) < 0;

        return (
          <Link className={card.label.startsWith("Silver") ? "compact-rate-card silver-card compact-rate-link" : "compact-rate-card compact-rate-link"} href={card.href} key={card.label} aria-label={`Open detailed ${card.label} information`}>
            <span>{card.label}</span>
            <div>
              <strong>{card.rate === undefined ? "Loading..." : formatCurrency(card.rate, countryCode, card.label.startsWith("Silver") ? 2 : 0)}</strong>
              <em className={down ? "negative" : ""}>
                {card.change === undefined ? "..." : formatSignedAmount(card.change, countryCode)}
                <b>{down ? "▼" : "▲"}</b>
              </em>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function GoldPerGramTable({
  gold24,
  gold22,
  gold18,
  silver,
  countryCode,
  countryName,
  currency,
}: {
  gold24: GoldRate | null;
  gold22: GoldRate | null;
  gold18: GoldRate | null;
  silver: SilverRate | null;
  countryCode: string;
  countryName: string;
  currency: string;
}) {
  const rows = [1, 8, 10, 100];
  const ready = Boolean(gold24 && gold22 && gold18);

  return (
    <section className="wrap section rate-section" id="today-rates">
      <h2 className="rate-title">Today Gold Price Per Gram in {countryName} ({currency})</h2>
      <CompactRateCards gold24={gold24} gold22={gold22} gold18={gold18} silver={silver} countryCode={countryCode} />
      <div className="rate-table-card">
        <div className="rate-row rate-head">
          <span>Gram</span>
          <span>24K</span>
          <span>22K</span>
          <span>18K</span>
        </div>
        {ready
          ? rows.map((grams) => (
              <div className="rate-row" key={grams}>
                <b>{grams}</b>
                <span>
                  {formatCurrency((gold24 as GoldRate).pricePerGram * grams, countryCode, 0)}
                  <em className={(gold24 as GoldRate).changeAmount < 0 ? "negative" : ""}>({formatSignedAmount((gold24 as GoldRate).changeAmount * grams, countryCode)})</em>
                </span>
                <span>
                  {formatCurrency((gold22 as GoldRate).pricePerGram * grams, countryCode, 0)}
                  <em className={(gold22 as GoldRate).changeAmount < 0 ? "negative" : ""}>({formatSignedAmount((gold22 as GoldRate).changeAmount * grams, countryCode)})</em>
                </span>
                <span>
                  {formatCurrency((gold18 as GoldRate).pricePerGram * grams, countryCode, 0)}
                  <em className={(gold18 as GoldRate).changeAmount < 0 ? "negative" : ""}>({formatSignedAmount((gold18 as GoldRate).changeAmount * grams, countryCode)})</em>
                </span>
              </div>
            ))
          : rows.map((grams) => (
              <div className="rate-row loading-row" key={grams}>
                <b>{grams}</b>
                <span>Loading live rate...</span>
                <span>Loading live rate...</span>
                <span>Loading live rate...</span>
              </div>
            ))}
      </div>
    </section>
  );
}

function MajorCityGoldRates({ countryCode }: { countryCode: string }) {
  const displayCities = useMemo(() => majorCityOrder.map((slug) => cityRates.find((city) => city.slug === slug)).filter(Boolean) as typeof cityRates, []);
  const [rows, setRows] = useState<CityGoldRow[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (countryCode !== "IN") {
      queueMicrotask(() => {
        setRows([]);
        setStatus("ready");
      });
      return;
    }

    const controller = new AbortController();

    async function loadCities() {
      try {
        setStatus("loading");
        const response = await fetch("/api/prices/city-rates", { signal: controller.signal });

        if (!response.ok) {
          throw new Error("City rates unavailable");
        }

        const payload = (await response.json()) as { rows: CityGoldRow[] };
        setRows(payload.rows);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) {
          setRows([]);
          setStatus("error");
        }
      }
    }

    loadCities();

    return () => controller.abort();
  }, [countryCode, displayCities]);

  if (countryCode !== "IN") {
    return null;
  }

  return (
    <section className="wrap section rate-section" id="city-rates">
      <h2 className="rate-title">Indian Major Cities Gold Rates Today (1 gram)</h2>
      {status === "error" ? <div className="inline-error">City-wise Goodreturns rates are temporarily unavailable. Please refresh again shortly.</div> : null}
      <div className="rate-table-card city-rate-table">
        <div className="rate-row rate-head">
          <span>City</span>
          <span>24K</span>
          <span>22K</span>
          <span>18K</span>
        </div>
        {status === "loading"
          ? displayCities.slice(0, visibleCount).map((city) => (
              <div className="rate-row loading-row" key={city.slug}>
                <b>{city.sourceName}</b>
                <span>Loading...</span>
                <span>Loading...</span>
                <span>Loading...</span>
              </div>
            ))
          : rows.slice(0, visibleCount).map((item) => (
              <Link className="rate-row city-rate-row" href={`/gold-price/${item.slug}`} key={item.slug}>
                <b>{item.city}</b>
                <span>{formatCurrency(item.gold24, "IN", 0)}</span>
                <span>{formatCurrency(item.gold22, "IN", 0)}</span>
                <span>{formatCurrency(item.gold18, "IN", 0)}</span>
              </Link>
            ))}
        {visibleCount < displayCities.length ? (
          <button className="see-more" type="button" onClick={() => setVisibleCount(displayCities.length)}>
            See more <ChevronRight size={15} />
          </button>
        ) : null}
      </div>
    </section>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [goldRange, setGoldRange] = useState("1D");
  const [silverRange, setSilverRange] = useState("1D");
  const city = cityRates[0];
  const countryCode = searchParams.get("country") || "IN";
  const selectedDate = searchParams.get("date") || "";
  const country = getCountry(countryCode);
  const [livePrices, setLivePrices] = useState<LivePricePayload | null>(null);
  const [priceError, setPriceError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPrices() {
      try {
        const response = await fetch(`/api/prices/current?city=${city.slug}&country=${countryCode}&date=${selectedDate}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Price API unavailable");
        }
        setLivePrices((await response.json()) as LivePricePayload);
        setPriceError(false);
      } catch {
        if (!controller.signal.aborted) {
          setPriceError(true);
        }
      }
    }

    loadPrices();
    const timer = window.setInterval(loadPrices, 60000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [city.slug, countryCode, selectedDate]);

  const gold24 = livePrices?.gold.find((item) => item.purity === "24K") ?? null;
  const gold22 = livePrices?.gold.find((item) => item.purity === "22K") ?? null;
  const gold18 = livePrices?.gold.find((item) => item.purity === "18K") ?? null;
  const silver = livePrices?.silver ?? null;

  return (
    <div className="app">
      <SiteHeader citySlug={city.slug} />
      <main>
        <section className="wrap hero hero-clean" id="dashboard">
          <div className="hero-copy">
            <span className="eyebrow">{country.name} metal rates</span>
            <h1>Today&apos;s gold and silver prices.</h1>
            <p>Fast country and city-wise rates, simple charts, news, and practical buying tools.</p>
          </div>
        </section>

        {priceError ? <div className="wrap inline-error">Live prices are temporarily unavailable. Please refresh again shortly.</div> : null}
        <QuickTools />
        <GoldPerGramTable gold24={gold24} gold22={gold22} gold18={gold18} silver={silver} countryCode={countryCode} countryName={countryCode === "IN" ? "India" : country.name} currency={country.currency} />

        {gold22 ? <CalculatorPreview ratePerGram={gold22.pricePerGram} countryCode={countryCode} /> : null}

        <section className="wrap section" id="historical">
          <Heading eyebrow="Market movement" title="Trends" copy="Goodreturns last 10 daily rates tuned for small screens." />
          <div className="charts">
            <Chart type="gold" range={goldRange} setRange={setGoldRange} countryCode={countryCode} />
            <Chart type="silver" range={silverRange} setRange={setSilverRange} countryCode={countryCode} />
          </div>
        </section>

        <MajorCityGoldRates countryCode={countryCode} />

        <NewsSection countryCode={countryCode} />

        <section className="wrap section faq">
          <Heading eyebrow="Need to know" title="FAQ" />
          <div className="faq-list">
            {[
              ["Are these jeweller rates?", "No. These are indicative rates for comparison. Jewellers can add premiums, making charges, wastage and GST."],
              ["Why use city routes?", "City routes help users and search engines land directly on the relevant local price page."],
              ["Where do prices come from?", "The app reads Goodreturns gold and silver pages through the server API and shows a friendly unavailable state if the source cannot be reached."],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="wrap footer-inner">
          <div>
            <Link className="logo" href="/">
              <span>Gold</span>SilverPrices
            </Link>
            <p>Clear metal prices for India. Informational use only.</p>
          </div>
          <div className="footer-links">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>
      </footer>
      <nav className="mobile-bottom" aria-label="Mobile quick navigation">
        <Link href="/">
          <Coins size={17} />
          Home
        </Link>
        <Link href={`/gold-price/${city.slug}`}>
          <MapPin size={17} />
          City
        </Link>
        <Link href="/calculator">
          <Calculator size={17} />
          Calc
        </Link>
      </nav>
      <ConsentPrompt />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="app" />}>
      <HomeContent />
    </Suspense>
  );
}

