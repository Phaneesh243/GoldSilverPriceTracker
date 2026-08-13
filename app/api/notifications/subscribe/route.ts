import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { notificationsConfigured, removeSubscription, saveSubscription } from "../../../../lib/push-notifications";
import { redis } from "../../../../lib/redis";

export const runtime = "nodejs";

const ratelimit = redis
  ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: false,
    prefix: "rl:notif:subscribe",
  })
  : null;

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "anon";
  }
  return request.headers.get("x-real-ip") || "anon";
}

async function withinLimit(request: Request) {
  if (!ratelimit) return true;
  const { success } = await ratelimit.limit(clientKey(request));
  return success;
}

function extractSubscription(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;

  if (record.endpoint && record.keys) {
    return { subscription: record, city: undefined, purity: undefined };
  }

  if (record.subscription) {
    return {
      subscription: record.subscription,
      city: record.city,
      purity: record.purity,
    };
  }

  return null;
}

export async function POST(request: Request) {
  if (!notificationsConfigured()) {
    return NextResponse.json(
      {
        error: "Notifications are not configured.",
        message: "Add Upstash Redis and VAPID keys to store browser push subscriptions.",
      },
      { status: 503 },
    );
  }

  if (!(await withinLimit(request))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = extractSubscription(body);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  try {
    await saveSubscription(parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!notificationsConfigured()) {
    return NextResponse.json({ error: "Notifications are not configured." }, { status: 503 });
  }

  if (!(await withinLimit(request))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const endpoint =
    typeof record.endpoint === "string"
      ? record.endpoint
      : typeof (record.subscription as Record<string, unknown> | undefined)?.endpoint === "string"
        ? ((record.subscription as Record<string, unknown>).endpoint as string)
        : null;

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint is required." }, { status: 400 });
  }

  try {
    await removeSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not unsubscribe." }, { status: 500 });
  }
}

