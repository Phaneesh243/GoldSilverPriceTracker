import "server-only";
import { Client, Receiver } from "@upstash/qstash";
import { redis } from "./redis";

export function marketJobsConfigured() {
  return Boolean(redis && process.env.MARKET_UPDATES_ENABLED === "true" && process.env.QSTASH_TOKEN && process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"));
}
export function siteOrigin() {
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("A canonical HTTPS site URL is required.");
  return url.origin;
}
export async function verifiedJobBody(request: Request) {
  if (!marketJobsConfigured()) throw new Error("Market jobs are disabled or not configured.");
  const body = await request.text();
  if (body.length > 4096) throw new Error("Job body too large.");
  const receiver = new Receiver({ currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!, nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!, devMode: false });
  const url = new URL(request.url);
  const valid = await receiver.verify({ signature: request.headers.get("upstash-signature") || "", body, url: siteOrigin() + url.pathname + url.search });
  if (!valid) throw new Error("Invalid job signature.");
  return JSON.parse(body) as Record<string, unknown>;
}
export async function enqueueMarketJob(path: string, body: unknown, id: string, delivery = false) {
  const client = new Client({ token: process.env.QSTASH_TOKEN!, devMode: false, enableTelemetry: false, retry: { retries: 1 } });
  return client.publishJSON({ url: siteOrigin() + path, body, deduplicationId: id, retries: 3, timeout: 25,
    ...(delivery ? { flowControl: { key: "gsp-market-delivery-v2", parallelism: 1, rate: 1, period: "1s" } } : {}) });
}
