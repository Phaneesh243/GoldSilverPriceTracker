import { NextResponse } from "next/server";
import { currencyPairs, getCurrencyPair } from "../../../../lib/currencies";
import { getCurrencyRates } from "../../../../lib/currency-prices";

export const runtime = "nodejs";
export const revalidate = 300;

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get("pairs")?.split(",").map((item) => getCurrencyPair(item.trim())).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const pair = searchParams.get("pair");
  const selected = pair ? (getCurrencyPair(pair) ? [getCurrencyPair(pair)!] : null) : requested?.length ? requested : currencyPairs;
  if (!selected) return NextResponse.json({ error: "Unsupported currency pair." }, { status: 400 });
  const rates = await getCurrencyRates(selected);
  const available = rates.some((item) => item.status === "available");
  return NextResponse.json({ rates, status: available ? "available" : "unavailable", updatedAt: rates.find((item) => item.timestamp)?.timestamp || null, source: rates[0]?.source, sourceUrl: rates[0]?.sourceUrl }, { headers: CACHE_HEADERS });
}
