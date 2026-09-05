import { NextResponse } from "next/server";
import { fetchLiveStockQuotes } from "../../../../lib/stock-quotes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = [...new Set((url.searchParams.get("symbols") || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean))].slice(0, 50);
  const data = await fetchLiveStockQuotes(requested.length ? requested : undefined);
  const response = NextResponse.json({ ok: true, data, status: data.length ? "available" : "unavailable", source: "Yahoo Finance chart", fetchedAt: new Date().toISOString(), note: "Quotes can be delayed and should be verified with the official exchange before trading." });
  response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  return response;
}
