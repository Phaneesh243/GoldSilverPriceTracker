import { cryptoAssets } from "./crypto";

export const cryptoAssetIds = cryptoAssets.map((asset) => asset.slug);

export type LiveCryptoMarket = {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  market_cap: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
  market_cap_rank: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  last_updated?: string;
};

export async function fetchCryptoMarkets(ids = cryptoAssetIds): Promise<LiveCryptoMarket[]> {
  if (!ids.length) return [];
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=" + encodeURIComponent(ids.join(",")) + "&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h";
  const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000), next: { revalidate: 60 } });
  if (!response.ok) throw new Error("CoinGecko responded with " + response.status);
  return await response.json() as LiveCryptoMarket[];
}
