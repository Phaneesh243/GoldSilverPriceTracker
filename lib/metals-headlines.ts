import type { MetalKey } from "./metals";
export type MetalHeadline = { title: string; source: string; link: string; publishedAt: string };
export function safeHeadlineUrl(raw: unknown) {
  if (typeof raw !== "string" || raw.length > 3000) return null;
  try { const url = new URL(raw); if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".") || /^(\d+\.)|localhost|\.local$|\[/.test(url.hostname)) return null; return url.href; } catch { return null; }
}
export function metalHeadlines(raw: unknown, metal: MetalKey, now = Date.now()): MetalHeadline[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>(); const result: MetalHeadline[] = [];
  const relevant = new RegExp(`\\b${metal}\\b`, "i");
  for (const item of raw.slice(0, 100)) {
    if (!item || typeof item !== "object") continue;
    const title = typeof item.title === "string" ? item.title.replace(/<[^>]*>/g, "").trim().slice(0, 240) : "";
    const source = typeof item.source === "string" ? item.source.replace(/<[^>]*>/g, "").trim().slice(0, 100) : "";
    const link = safeHeadlineUrl(item.link); const time = typeof item.publishedAt === "string" ? Date.parse(item.publishedAt) : NaN;
    const key = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!title || !source || !link || !relevant.test(title) || !Number.isFinite(time) || time > now + 300000 || now - time > 30 * 86400000 || seen.has(key) || seen.has(link)) continue;
    seen.add(key); seen.add(link); result.push({ title, source, link, publishedAt: new Date(time).toISOString() });
  }
  return result.sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 6);
}
