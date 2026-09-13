import { NextResponse } from "next/server";
import { availableData, unavailableData } from "../../../lib/data-envelope";
import { getAllMetalPrices } from "../../../lib/metal-prices";
import { getNewsFeed } from "../../../lib/news";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const [metals, news] = await Promise.allSettled([getAllMetalPrices("mumbai", "IN"), getNewsFeed({ countryCode: "IN" })]);
  return NextResponse.json({
    ok: true,
    // Each metal carries its own availability, source and observation timestamp.
    metals: metals.status === "fulfilled" ? metals.value : { metals: [], status: "unavailable", message: "Metal providers are unavailable." },
    news: news.status === "fulfilled" ? availableData(news.value, news.value.source, "https://news.google.com/", news.value.fetchedAt) : unavailableData("Google News RSS", "https://news.google.com/", "Headlines unavailable.", null),
    generatedAt: new Date().toISOString(),
  }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
