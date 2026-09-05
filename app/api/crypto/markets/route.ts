import { NextResponse } from "next/server";
import { cryptoAssets } from "../../../../lib/crypto";
import { cryptoAssetIds, fetchCryptoMarkets } from "../../../../lib/crypto-market-provider";

export const runtime = "nodejs";
export const revalidate = 60;

function compactInr(value: number | null | undefined) {
  if (!value || !Number.isFinite(value)) return "Unavailable";
  if (value >= 1e12) return "₹" + (value / 1e12).toFixed(1) + "T";
  if (value >= 1e9) return "₹" + (value / 1e9).toFixed(1) + "B";
  if (value >= 1e6) return "₹" + (value / 1e6).toFixed(1) + "M";
  return "₹" + Math.round(value).toLocaleString("en-IN");
}

function compactSupply(value: number | null | undefined, symbol: string) {
  if (!value || !Number.isFinite(value)) return "Unavailable";
  if (value >= 1e9) return (value / 1e9).toFixed(2) + "B " + symbol;
  if (value >= 1e6) return (value / 1e6).toFixed(2) + "M " + symbol;
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " " + symbol;
}

export async function GET() {
  try {
    const remote = await fetchCryptoMarkets(cryptoAssetIds);
    const assets = remote.map((item) => {
      const reference = cryptoAssets.find((asset) => asset.slug === item.id);
      if (!reference || item.current_price === null) return null;
      return {
        ...reference,
        priceInr: item.current_price,
        priceUsd: null,
        change24h: item.price_change_percentage_24h,
        marketCap: compactInr(item.market_cap),
        volume: compactInr(item.total_volume),
        rank: item.market_cap_rank,
        circulatingSupply: compactSupply(item.circulating_supply, reference.symbol),
        maxSupply: item.max_supply ? compactSupply(item.max_supply, reference.symbol) : "Unavailable",
        ath: item.ath ? "₹" + item.ath.toLocaleString("en-IN") : "Unavailable",
        source: "CoinGecko public market data",
        updatedAt: item.last_updated || new Date().toISOString(),
      };
    }).filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));
    return NextResponse.json({ assets, source: "CoinGecko public API", updatedAt: new Date().toISOString(), status: assets.length ? "available" : "unavailable", fallback: false }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    return NextResponse.json({ assets: [], source: "CoinGecko public API", updatedAt: new Date().toISOString(), status: "unavailable", fallback: false, error: error instanceof Error ? error.message : "Market data is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
