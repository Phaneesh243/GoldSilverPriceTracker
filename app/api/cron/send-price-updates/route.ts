import { NextResponse } from "next/server";
import { sendTargetPriceAlerts } from "../../../../lib/metal-alerts";
import { sendBigMoveAlerts } from "../../../../lib/push-notifications";
import { isAuthorizedCron } from "../../../../lib/cron-auth";
import { sendUserAlerts } from "../../../../lib/user-alerts";
import { withCronLock } from "../../../../lib/cron-lock";
import { sendMarketDigest, type MarketDigestSlot } from "../../../../lib/market-digest";

export const runtime = "nodejs";

const VALID_SLOTS: MarketDigestSlot[] = ["morning", "midday", "close", "evening"];

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const slot = searchParams.get("slot");

  if (mode === "alerts" || slot === "alerts") {
    try {
      const startedAt = new Date().toISOString();
      const job = await withCronLock("user-alerts", async () => Promise.allSettled([sendBigMoveAlerts(), sendTargetPriceAlerts(), sendUserAlerts()]));
      if (!job.acquired || !job.result) return NextResponse.json({ ok: true, skipped: "already-running", startedAt, endedAt: new Date().toISOString() });
      const [movement, targets, users] = job.result;
      return NextResponse.json({
        ok: movement.status === "fulfilled" || targets.status === "fulfilled",
        mode: "alerts",
        startedAt,
        endedAt: new Date().toISOString(),
        lock: job.lock,
        movement: movement.status === "fulfilled" ? movement.value : { error: movement.reason instanceof Error ? movement.reason.message : "Movement alerts failed." },
        targets: targets.status === "fulfilled" ? targets.value : { error: targets.reason instanceof Error ? targets.reason.message : "Target alerts failed." },
        users: users.status === "fulfilled" ? users.value : { error: users.reason instanceof Error ? users.reason.message : "User alerts failed." },
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Price movement alert job could not run.",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 503 },
      );
    }
  }

  const slotParam = (slot || "morning") as MarketDigestSlot;

  if (!VALID_SLOTS.includes(slotParam)) {
    return NextResponse.json({ error: "Invalid slot." }, { status: 400 });
  }

  try {
    const startedAt = new Date().toISOString();
    const job = await withCronLock(`market-digest:${slotParam}`, () => sendMarketDigest(slotParam));
    if (!job.acquired || !job.result) return NextResponse.json({ ok: true, skipped: "already-running", slot: slotParam, startedAt, endedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, ...job.result, startedAt, endedAt: new Date().toISOString(), lock: job.lock });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Scheduled notification job could not run.",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
