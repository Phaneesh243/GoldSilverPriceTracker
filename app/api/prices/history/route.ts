import { NextResponse } from "next/server";
import { getLiveHistory } from "../../../../lib/live-prices";

export const revalidate = 60;
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const metal = params.get("metal") === "silver" ? "silver" : "gold";
  const country = params.get("country") || "IN";
  const period = params.get("period") || "1d";

  try {
    const payload = await getLiveHistory(metal, country, period);

    return NextResponse.json(
      {
        ...payload,
        city: params.get("city") || "Mumbai",
        period,
      },
      { headers: CACHE_HEADERS },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Live historical feed is temporarily unavailable.",
        message: "Please try again shortly. We do not show estimated historical prices when live data is unavailable.",
        data: [],
      },
      { status: 503 },
    );
  }
}
