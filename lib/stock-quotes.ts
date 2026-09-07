import { indianStocks } from "./indian-stocks";

type YahooChart = { chart?: { result?: Array<{ meta?: { currency?: string; regularMarketPrice?: number; previousClose?: number; chartPreviousClose?: number; regularMarketTime?: number }; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };

export type LiveStockQuote = {
  slug: string;
  ticker: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  exchange: string;
  timestamp: string;
  source: "Yahoo Finance chart";
};

export async function fetchLiveStockQuote(slug: string, ticker: string): Promise<LiveStockQuote | null> {
  for (const suffix of [".NS", ".BO"]) {
    try {
      const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(ticker + suffix) + "?range=1d&interval=1m&includePrePost=false&events=div%2Csplits";
      const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "GoldSilverPrices/1.0" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) continue;
      const payload = await response.json() as YahooChart;
      const result = payload.chart?.result?.[0];
      const meta = result?.meta;
      if (!meta) continue;
      const closes = result?.indicators?.quote?.[0]?.close || [];
      const lastClose = [...closes].reverse().find((value): value is number => typeof value === "number" && Number.isFinite(value));
      const price = typeof meta?.regularMarketPrice === "number" ? meta.regularMarketPrice : lastClose;
      if (typeof price !== "number" || !Number.isFinite(price) || typeof meta.regularMarketTime !== "number") continue;
      const previousClose = typeof meta.previousClose === "number" ? meta.previousClose : typeof meta.chartPreviousClose === "number" ? meta.chartPreviousClose : null;
      const change = previousClose === null ? null : price - previousClose;
      const changePercent = previousClose && change !== null ? (change / previousClose) * 100 : null;
      return { slug, ticker, price, previousClose, change, changePercent, currency: meta.currency || "INR", exchange: suffix === ".NS" ? "NSE" : "BSE", timestamp: new Date(meta.regularMarketTime * 1000).toISOString(), source: "Yahoo Finance chart" };
    } catch {
      // Try BSE after NSE before declaring the quote unavailable.
    }
  }
  return null;
}

export async function fetchLiveStockQuotes(slugs = indianStocks.map((stock) => stock.slug)) {
  const selected = indianStocks.filter((stock) => slugs.includes(stock.slug));
  return (await Promise.all(selected.map((stock) => fetchLiveStockQuote(stock.slug, stock.symbol)))).filter((quote): quote is LiveStockQuote => Boolean(quote));
}
