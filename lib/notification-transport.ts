import "server-only";
import webpush from "web-push";
import { redis } from "./redis";
import { isPushSubscriptionActive, removePushSubscription, type PushSubscriptionRecord } from "./storage";

export function notificationsConfigured() {
  return Boolean(redis && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL);
}
export async function sendDeviceUpdate(userId: string, record: PushSubscriptionRecord, payload: { title: string; body: string; tag: string; expiresAt: number }) {
  if (!notificationsConfigured()) throw new Error("Browser push is not configured.");
  if (!(await isPushSubscriptionActive(userId, record))) return "skipped" as const;
  webpush.setVapidDetails(`mailto:${process.env.VAPID_EMAIL}`, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  try {
    await webpush.sendNotification({ endpoint: record.endpoint, keys: { p256dh: record.p256dh, auth: record.auth } }, JSON.stringify({ ...payload, userId, url: "/notifications" }), { TTL: Math.max(0, Math.floor((payload.expiresAt - Date.now()) / 1000)), timeout: 8000 });
    return "sent" as const;
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) { await removePushSubscription(userId, record.id); return "skipped" as const; }
    throw new Error(`Push provider failure (${status || "network"}).`);
  }
}
