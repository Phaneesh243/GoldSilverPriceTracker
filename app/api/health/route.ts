import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let storage: "available" | "unavailable" = "unavailable";
  if (redis) {
    try {
      await redis.set("gsp:health:last-check", new Date().toISOString(), { ex: 120 });
      storage = "available";
    } catch {
      storage = "unavailable";
    }
  }
  const healthy = storage === "available";
  return NextResponse.json({ ok: healthy, service: "goldsilverprices", environment: process.env.NODE_ENV, checkedAt: new Date().toISOString(), dependencies: { redis: storage }, note: healthy ? "Application dependencies are reachable." : "Configure production Redis before enabling account features." }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
