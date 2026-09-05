import { NextResponse } from "next/server";
import { getCurrencyPair } from "../../../../lib/currencies";
import { getCurrencyHistory } from "../../../../lib/currency-prices";

export const runtime = "nodejs";
export const revalidate = 600;

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pair = getCurrencyPair(searchParams.get("pair"));
  const period = searchParams.get("period") || "30d";
  if (!pair) return NextResponse.json({ error: "Unsupported currency pair." }, { status: 400 });
  if (!["1d", "7d", "30d", "90d", "1y"].includes(period)) return NextResponse.json({ error: "Unsupported history period." }, { status: 400 });
  return NextResponse.json(await getCurrencyHistory(pair, period), { headers: CACHE_HEADERS });
}
