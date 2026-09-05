import { NextResponse } from "next/server";
import { availableData, unavailableData } from "../../../lib/data-envelope";
import { getCurrencyRates } from "../../../lib/currency-prices";
import { currencyPairs } from "../../../lib/currencies";
import { getNewsFeed } from "../../../lib/news";
import { getLiveCityPrices } from "../../../lib/live-prices";
import { fetchLiveStockQuotes } from "../../../lib/stock-quotes";
import { cryptoAssetIds, fetchCryptoMarkets } from "../../../lib/crypto-market-provider";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const [stocks, crypto, currencies, metals, news] = await Promise.allSettled([
    fetchLiveStockQuotes(),
    fetchCryptoMarkets(cryptoAssetIds.slice(0, 10)),
    getCurrencyRates(currencyPairs.slice(0, 4)),
    getLiveCityPrices("mumbai", "IN"),
    getNewsFeed({ countryCode: "IN" }),
  ]);
  const envelope = <T,>(result: PromiseSettledResult<T>, source: string, sourceUrl: string) => result.status === "fulfilled" ? availableData(result.value, source, sourceUrl) : unavailableData(source, sourceUrl, "Provider temporarily unavailable.", null as T);
  const payload = {
    stocks: envelope(stocks, "Yahoo Finance chart", "https://finance.yahoo.com/"),
    crypto: envelope(crypto, "CoinGecko public market data", "https://www.coingecko.com/en/api"),
    currencies: envelope(currencies, "Frankfurter reference FX feed", "https://www.frankfurter.app/"),
    metals: envelope(metals, "Goodreturns city rate feed", "https://www.goodreturns.in/gold-rates/"),
    news: envelope(news, "Google News RSS", "https://news.google.com/"),
    generatedAt: new Date().toISOString(),
  };
  return NextResponse.json({ ok: true, ...payload }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
