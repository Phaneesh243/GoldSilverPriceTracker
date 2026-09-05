import { NextResponse } from "next/server";
import { getNewsFeed, type NewsCategory, type NewsMetal } from "../../../lib/news";

export const runtime = "nodejs";
export const revalidate = 600;

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" };

function isMetal(value: string | null): value is NewsMetal {
  return value === "gold" || value === "silver" || value === "platinum" || value === "copper";
}

function isCategory(value: string | null): value is NewsCategory {
  return value === "metals" || value === "markets" || value === "investing" || value === "analysis" || value === "stocks" || value === "crypto" || value === "funds" || value === "insurance" || value === "bonds" || value === "currencies";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const metalValue = searchParams.get("metal");
  const categoryValue = searchParams.get("category");
  try {
    const feed = await getNewsFeed({ countryCode: searchParams.get("country") || "IN", metal: isMetal(metalValue) ? metalValue : undefined, category: isCategory(categoryValue) ? categoryValue : undefined });
    return NextResponse.json(feed, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: "News feed is temporarily unavailable.", items: [] }, { status: 503 });
  }
}
