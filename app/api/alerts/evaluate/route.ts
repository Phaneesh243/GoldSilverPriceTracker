import { NextResponse } from "next/server";
import { withCronLock } from "../../../../lib/cron-lock";
import { sendUserAlerts } from "../../../../lib/user-alerts";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Not found." }, { status: 404 });
  const startedAt = new Date().toISOString();
  const job = await withCronLock("user-alerts", sendUserAlerts);
  if (!job.acquired || !job.result) return NextResponse.json({ ok: true, skipped: "already-running", startedAt, endedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true, ...job.result, startedAt, endedAt: new Date().toISOString(), lock: job.lock });
}
