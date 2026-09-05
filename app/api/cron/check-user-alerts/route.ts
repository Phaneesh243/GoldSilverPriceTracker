import { NextResponse } from "next/server";
import { isAuthorizedCron } from "../../../../lib/cron-auth";
import { sendUserAlerts } from "../../../../lib/user-alerts";
import { withCronLock } from "../../../../lib/cron-lock";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const startedAt = new Date().toISOString();
    const job = await withCronLock("user-alerts", sendUserAlerts);
    if (!job.acquired || !job.result) return NextResponse.json({ ok: true, skipped: "already-running", startedAt, endedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, ...job.result, startedAt, endedAt: new Date().toISOString(), lock: job.lock });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not check user alerts." }, { status: 503 });
  }
}
