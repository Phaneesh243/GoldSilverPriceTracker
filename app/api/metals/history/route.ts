import { NextResponse } from "next/server";
import { getMetalHistory } from "../../../../lib/metal-prices";
import type { MetalKey } from "../../../../lib/metals";

export const runtime = "nodejs";
export const revalidate = 600;

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" };

function isMetalKey(value: string | null): value is MetalKey {
  return value === "gold" || value === "silver" || value === "platinum" || value === "copper";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const metal = searchParams.get("metal");

  if (!isMetalKey(metal)) {
    return NextResponse.json({ error: "Unsupported metal." }, { status: 400 });
  }

  const country = searchParams.get("country") || "IN";
  const period = searchParams.get("period") || "10d";
  if (country !== "IN" || !["1d", "7d", "10d", "30d", "1y"].includes(period)) return NextResponse.json({ error: "Unsupported country or historical range." }, { status: 400 });
  const history = await getMetalHistory(metal, country, period);

  return NextResponse.json(history, { headers: CACHE_HEADERS });
}
