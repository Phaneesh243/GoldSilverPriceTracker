import { Client } from "@upstash/qstash";
import { MARKET_SCHEDULES } from "../lib/market-schedule.ts";

// Intentionally does not load .env.local. Supply production credentials explicitly.
const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.invalid");
if (origin.protocol !== "https:" || origin.hostname === "example.invalid") throw new Error("Set NEXT_PUBLIC_SITE_URL to your deployed HTTPS application.");
const apply = process.argv.includes("--apply");
const schedules = MARKET_SCHEDULES.map((schedule) => ({
  scheduleId: schedule.id,
  destination: origin.origin + "/api/jobs/market-updates",
  cron: schedule.cron,
  body: JSON.stringify({ edition: schedule.edition }),
  headers: { "Content-Type": "application/json" },
  retries: 3,
}));
if (!apply) {
  console.log("Dry run. No schedules created.", schedules);
  console.log("After deployment checks, rerun with --apply to create/update exactly these two named schedules.");
} else {
  if (!process.env.QSTASH_TOKEN) throw new Error("QSTASH_TOKEN is required.");
  const client = new Client({ token: process.env.QSTASH_TOKEN, devMode: false, enableTelemetry: false });
  for (const schedule of schedules) console.log(await client.schedules.create(schedule));
}
