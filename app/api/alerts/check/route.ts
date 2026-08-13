import { NextResponse } from "next/server";
import { sendTargetPriceAlerts } from "../../../../lib/metal-alerts";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  if (request.headers.get("x-vercel-cron")) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await sendTargetPriceAlerts();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not check alerts." }, { status: 503 });
  }
}
