import { NextResponse } from "next/server";
import { sendTargetPriceAlerts } from "../../../../lib/metal-alerts";
import { sendBigMoveAlerts, sendDigest, type DigestSlot } from "../../../../lib/push-notifications";

export const runtime = "nodejs";

const VALID_SLOTS: DigestSlot[] = ["morning", "midday", "evening"];

function isAuthorized(request: Request) {
  if (request.headers.get("x-vercel-cron")) {
    return true;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const slot = searchParams.get("slot");

  if (mode === "alerts" || slot === "alerts") {
    try {
      const [movement, targets] = await Promise.allSettled([sendBigMoveAlerts(), sendTargetPriceAlerts()]);
      return NextResponse.json({
        ok: movement.status === "fulfilled" || targets.status === "fulfilled",
        mode: "alerts",
        movement: movement.status === "fulfilled" ? movement.value : { error: movement.reason instanceof Error ? movement.reason.message : "Movement alerts failed." },
        targets: targets.status === "fulfilled" ? targets.value : { error: targets.reason instanceof Error ? targets.reason.message : "Target alerts failed." },
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

  const slotParam = (slot || "morning") as DigestSlot;

  if (!VALID_SLOTS.includes(slotParam)) {
    return NextResponse.json({ error: "Invalid slot." }, { status: 400 });
  }

  try {
    const result = await sendDigest(slotParam);
    return NextResponse.json({ ok: true, ...result });
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
