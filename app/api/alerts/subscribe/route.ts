import { NextResponse } from "next/server";
import { saveTargetAlert } from "../../../../lib/metal-alerts";
import type { MetalKey } from "../../../../lib/metals";

export const runtime = "nodejs";

function isMetalKey(value: unknown): value is MetalKey {
  return value === "gold" || value === "silver" || value === "platinum" || value === "copper";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isMetalKey(body.metal)) {
    return NextResponse.json({ error: "Unsupported metal." }, { status: 400 });
  }

  const direction = body.direction === "above" || body.direction === "below" || body.direction === "movement" ? body.direction : null;
  if (!direction) {
    return NextResponse.json({ error: "Invalid alert direction." }, { status: 400 });
  }

  try {
    const alert = await saveTargetAlert({
      endpoint: String(body.endpoint || ""),
      metal: body.metal,
      city: String(body.city || "mumbai").toLowerCase(),
      direction,
      targetPrice: typeof body.targetPrice === "number" ? body.targetPrice : null,
      movementPercent: typeof body.movementPercent === "number" ? body.movementPercent : null,
    });

    return NextResponse.json({ ok: true, alert });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save alert." }, { status: 400 });
  }
}
