import { NextResponse } from "next/server";
import { getAllMetalPrices, getMetalPrice } from "../../../../lib/metal-prices";
import { getMetalConfig, type MetalKey } from "../../../../lib/metals";

export const runtime = "nodejs";
export const revalidate = 300;

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" };

function isMetalKey(value: string | null): value is MetalKey {
  return value === "gold" || value === "silver" || value === "platinum" || value === "copper";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "mumbai";
  const country = searchParams.get("country") || "IN";
  const metal = searchParams.get("metal");

  try {
    if (metal) {
      if (!isMetalKey(metal)) {
        return NextResponse.json({ error: "Unsupported metal." }, { status: 400 });
      }

      const price = await getMetalPrice(metal, city, country);
      return NextResponse.json({ metal: price, config: getMetalConfig(metal) }, { headers: CACHE_HEADERS });
    }

    const prices = await getAllMetalPrices(city, country);
    return NextResponse.json(prices, { headers: CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Metal prices are temporarily unavailable.",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
