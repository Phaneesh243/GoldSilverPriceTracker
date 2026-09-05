import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const envExample = readFileSync(join(root, ".env.example"), "utf8");
const required = ["NEXT_PUBLIC_SITE_URL", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "CRON_SECRET"];
const missingExample = required.filter((key) => !envExample.includes(key + "="));
const findings = [];

if (missingExample.length) findings.push("Missing documented environment variables: " + missingExample.join(", "));
if (existsSync(join(root, ".env.local")) && process.env.NODE_ENV === "production") findings.push(".env.local must not be present in a production artifact.");
if (!existsSync(join(root, "app", "robots.ts"))) findings.push("app/robots.ts is missing.");
if (!existsSync(join(root, "app", "sitemap.ts"))) findings.push("app/sitemap.ts is missing.");
if (!existsSync(join(root, "app", "manifest.ts"))) findings.push("app/manifest.ts is missing.");
if (!existsSync(join(root, "public", "icon.svg"))) findings.push("public/icon.svg is missing.");

if (findings.length) {
  console.error("Release verification failed:");
  for (const finding of findings) console.error("- " + finding);
  process.exitCode = 1;
} else {
  console.log("Release verification passed: metadata, environment documentation and production safety checks are present.");
}
