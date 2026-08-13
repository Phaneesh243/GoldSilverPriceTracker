import { NextResponse } from "next/server";
import { getLiveCityPrices } from "../../../../lib/live-prices";
import { cityRates } from "../../../../lib/market-data";

export const runtime = "nodejs";
export const revalidate = 900;
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" };

const majorCityOrder = ["chennai", "mumbai", "delhi", "kolkata", "bengaluru", "hyderabad", "kerala", "pune", "vadodara", "ahmedabad"];

export async function GET() {
  const displayCities = majorCityOrder
    .map((slug) => cityRates.find((city) => city.slug === slug))
    .filter((city): city is (typeof cityRates)[number] => Boolean(city));

  const results = await Promise.allSettled(
    displayCities.map(async (city) => {
      const payload = await getLiveCityPrices(city.slug, "IN");

      return {
        slug: payload.slug,
        city: city.sourceName,
        gold24: payload.gold.find((item) => item.purity === "24K")?.pricePerGram ?? 0,
        gold22: payload.gold.find((item) => item.purity === "22K")?.pricePerGram ?? 0,
        gold18: payload.gold.find((item) => item.purity === "18K")?.pricePerGram ?? 0,
        updatedAt: payload.updatedAt,
        source: payload.source,
      };
    }),
  );

  const rows = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

  if (!rows.length) {
    return NextResponse.json(
      {
        error: "City-wise rates are temporarily unavailable.",
        rows: [],
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      country: "India",
      rows,
      failed: results.length - rows.length,
    },
    { headers: CACHE_HEADERS },
  );
}
