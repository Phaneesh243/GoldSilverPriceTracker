import { NextResponse } from "next/server";
import { sendTargetPriceAlerts } from "../../../../lib/metal-alerts";
import { isAuthorizedCron } from "../../../../lib/cron-auth";
import { sendUserAlerts } from "../../../../lib/user-alerts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const [legacy, users] = await Promise.allSettled([sendTargetPriceAlerts(), sendUserAlerts()]);
    return NextResponse.json({
      ok: legacy.status === "fulfilled" || users.status === "fulfilled",
      legacy: legacy.status === "fulfilled" ? legacy.value : { error: legacy.reason instanceof Error ? legacy.reason.message : "Legacy alerts failed." },
      users: users.status === "fulfilled" ? users.value : { error: users.reason instanceof Error ? users.reason.message : "User alerts failed." },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not check alerts." }, { status: 503 });
  }
}
