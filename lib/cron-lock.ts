import "server-only";

import { randomUUID } from "node:crypto";
import { redis } from "./redis";

export async function withCronLock<T>(name: string, run: () => Promise<T>, ttlSeconds = 12 * 60) {
  if (!redis) return { acquired: true, result: await run(), lock: "local-no-redis" as const };
  const key = `gsp:v1:cron-lock:${name}`;
  const token = randomUUID();
  const acquired = await redis.set(key, token, { nx: true, ex: ttlSeconds });
  if (!acquired) return { acquired: false, result: null, lock: "already-running" as const };
  try {
    return { acquired: true, result: await run(), lock: "redis" as const };
  } finally {
    const current = await redis.get<string>(key).catch(() => null);
    if (current === token) await redis.del(key).catch(() => 0);
  }
}
