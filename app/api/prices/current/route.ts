import { NextResponse } from "next/server";
import { getLiveCityPrices } from "../../../../lib/live-prices";
import { redis } from "../../../../lib/redis";

export const revalidate = 30;
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const city = params.get("city") || "mumbai";
  const country = params.get("country") || "IN";
  const date = params.get("date") || "";
  const cacheKey = `current:prices:${country.toUpperCase()}:${city.toLowerCase()}:${date || "today"}:live`;

  try {
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached, { headers: CACHE_HEADERS });
      }
    }

    const payload = await getLiveCityPrices(city, country, date);

    if (redis) {
      await redis.set(cacheKey, payload, { ex: 30 });
    }

    return NextResponse.json(payload, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      {
        error: "Live price feed is temporarily unavailable.",
        message: "Please try again shortly. We do not show estimated prices when live data is unavailable.",
      },
      { status: 503 },
    );
  }
}
