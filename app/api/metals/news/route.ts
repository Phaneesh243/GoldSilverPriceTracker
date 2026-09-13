import { getNewsFeed } from "../../../../lib/news";
import { metalHeadlines } from "../../../../lib/metals-headlines";
import type { MetalKey } from "../../../../lib/metals";
export const revalidate = 600;
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const metal = params.get("metal") || "gold";
  if (!["gold", "silver", "platinum", "copper"].includes(metal) || (params.get("country") || "IN") !== "IN") return Response.json({ error: "Unsupported metal or country." }, { status: 400 });
  try {
    const feed = await getNewsFeed({ countryCode: "IN", metal: metal as MetalKey });
    return Response.json({ items: metalHeadlines(feed.items, metal as MetalKey), source: feed.source, fetchedAt: feed.fetchedAt, countryCode: "IN" }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600" } });
  } catch { return Response.json({ error: "Headlines temporarily unavailable.", items: [] }, { status: 503 }); }
}
