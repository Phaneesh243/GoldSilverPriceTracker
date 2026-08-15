import { NextResponse } from "next/server";
import { notificationsConfigured } from "../../../../lib/push-notifications";
import { redis } from "../../../../lib/redis";

export const runtime = "nodejs";

export async function GET() {
  const hasRedis = Boolean(redis);
  const hasPublicKey = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  const hasPrivateKey = Boolean(process.env.VAPID_PRIVATE_KEY);
  const hasEmail = Boolean(process.env.VAPID_EMAIL);

  return NextResponse.json(
    {
      configured: hasRedis && hasPublicKey && hasPrivateKey && hasEmail && notificationsConfigured(),
      redis: hasRedis,
      // The public key is safe to expose to browsers; the private key is never returned.
      vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
      vapidPrivateKey: hasPrivateKey,
      vapidEmail: hasEmail,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
