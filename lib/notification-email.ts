import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { redis } from "./redis";
import { sendAlertEmail } from "./email";
import { siteOrigin } from "./market-jobs";
import { getProfile, updateUserSettings, verifyAccountEmail, StorageValidationError } from "./storage";

export async function reserveEmailQuota(id: string, now = new Date()) {
  if (!redis) throw new Error("Redis is required for email quotas.");
  const date = now.toISOString().slice(0, 10);
  const daily = Math.min(90, Math.max(1, Number(process.env.RESEND_DAILY_LIMIT || 90)));
  const monthly = Math.min(2900, Math.max(1, Number(process.env.RESEND_MONTHLY_LIMIT || 2900)));
  if (!Number.isFinite(daily) || !Number.isFinite(monthly)) throw new Error("Invalid email quota configuration.");
  const reservation = createHash("sha256").update(id).digest("hex");
  const result = await redis.eval(`
    if redis.call('EXISTS', KEYS[3]) == 1 then return 1 end
    if tonumber(redis.call('GET', KEYS[1]) or '0') >= tonumber(ARGV[1]) or tonumber(redis.call('GET', KEYS[2]) or '0') >= tonumber(ARGV[2]) then return 0 end
    redis.call('INCR', KEYS[1]); redis.call('EXPIRE', KEYS[1], 172800)
    redis.call('INCR', KEYS[2]); redis.call('EXPIRE', KEYS[2], 3024000)
    redis.call('SET', KEYS[3], '1', 'EX', 172800)
    return 1
  `, [`gsp:v2:email-day:${date}`, `gsp:v2:email-month:${date.slice(0, 7)}`, `gsp:v2:email-reserved:${reservation}`], [daily, monthly]);
  return result === 1;
}
function signingSecret() {
  const secret = process.env.NOTIFICATION_SIGNING_SECRET;
  if (!secret || secret.length < 32) throw new Error("Notification signing secret is not configured.");
  return secret;
}
export function unsubscribeUrl(userId: string) {
  const payload = Buffer.from(userId).toString("base64url");
  const signature = createHmac("sha256", signingSecret()).update(`email-v2:${payload}`).digest("base64url");
  return `${siteOrigin()}/api/notifications/unsubscribe?token=${payload}.${signature}`;
}
export async function unsubscribeEmail(token: string) {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || token.length > 300) throw new Error("Invalid unsubscribe token.");
  const expected = createHmac("sha256", signingSecret()).update(`email-v2:${payload}`).digest();
  const provided = Buffer.from(signature, "base64url");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) throw new Error("Invalid unsubscribe token.");
  const userId = Buffer.from(payload, "base64url").toString();
  if (!(await getProfile(userId))) throw new Error("Account not found.");
  const settings = await import("./storage").then((storage) => storage.getUserSettings(userId));
  await updateUserSettings(userId, { notifications: { ...settings.notifications, emailAlerts: false } });
}
export async function requestEmailVerification(userId: string) {
  if (!redis) throw new Error("Redis is required.");
  const profile = await getProfile(userId);
  if (!profile?.email || profile.anonymous || profile.status !== "active") throw new Error("A signed-in account email is required.");
  if (profile.emailVerified) return;
  const throttle = `gsp:v2:verify-throttle:${userId}`;
  if (!await redis.set(throttle, "1", { nx: true, ex: 60 })) throw new StorageValidationError("Please wait one minute before requesting another verification email.");
  const dayKey = `gsp:v2:verify-count:${userId}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis.incr(dayKey);
  await redis.expire(dayKey, 86400);
  if (count > 5) throw new StorageValidationError("Verification request limit reached. Try tomorrow.");
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  if (!await reserveEmailQuota(`verification:${hash}`)) throw new StorageValidationError("Email quota reached. Try again tomorrow.");
  await redis.set(`gsp:v2:verify:${hash}`, { userId, email: profile.email }, { ex: 3600 });
  const url = `${siteOrigin()}/notifications/verify?token=${token}`;
  await sendAlertEmail({ to: profile.email, subject: "Verify your GoldSilverPrices email", text: `Verify your email within one hour: ${url}\nThis does not subscribe you to notifications.`, html: `<p><a href="${url}">Verify your email</a> within one hour.</p><p>This does not subscribe you to notifications. Ignore this message if you did not request it.</p>`, idempotencyKey: `verify-${hash}` });
}
export async function confirmEmailVerification(userId: string, token: string) {
  if (!redis || !/^[a-zA-Z0-9_-]{43}$/.test(token)) throw new StorageValidationError("Invalid verification link.");
  const key = `gsp:v2:verify:${createHash("sha256").update(token).digest("hex")}`;
  const record = await redis.get<{ userId: string; email: string }>(key);
  if (!record || record.userId !== userId) throw new StorageValidationError("Sign in to the matching account or request a fresh verification link.");
  await verifyAccountEmail(record.userId, record.email);
  await redis.del(key);
}
