export type MarketEdition = "open" | "close";
export const MARKET_SCHEDULES = [
  { id: "gsp-market-open-v2", edition: "open" as const, cron: "45 3 * * 1-5", time: "09:15 IST" },
  { id: "gsp-market-close-v2", edition: "close" as const, cron: "0 10 * * 1-5", time: "15:30 IST" },
];
// NSE capital-market circulars CMTR71775 and CMTR72260.
// https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf
// https://nsearchives.nseindia.com/content/circulars/CMTR72260.pdf
const holidays2026 = new Set(["01-15", "01-26", "03-03", "03-26", "03-31", "04-03", "04-14", "05-01", "05-28", "06-26", "09-14", "10-02", "10-20", "11-10", "11-24", "12-25"]);
export function indiaDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function regularTradingDay(date: string): { eligible: boolean; reason: string } {
  if (!/^2026-\d{2}-\d{2}$/.test(date)) return { eligible: false, reason: "calendar-not-reviewed" };
  const day = new Date(date + "T00:00:00+05:30");
  if (!Number.isFinite(day.getTime()) || indiaDate(day) !== date) return { eligible: false, reason: "invalid-date" };
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Asia/Kolkata" }).format(day);
  if (weekday === "Sat" || weekday === "Sun") return { eligible: false, reason: "weekend-or-special-session" };
  if (holidays2026.has(date.slice(5))) return { eligible: false, reason: "exchange-holiday" };
  return { eligible: true, reason: "regular-session" };
}
export function editionWindow(edition: MarketEdition, date = indiaDate(), now = Date.now()) {
  const scheduledAt = new Date(`${date}T${edition === "open" ? "09:15" : "15:30"}:00+05:30`).getTime();
  const expiresAt = scheduledAt + 2 * 60 * 60_000;
  return { scheduledAt, expiresAt, allowed: Number.isFinite(scheduledAt) && now >= scheduledAt && now < expiresAt && regularTradingDay(date).eligible };
}
export function quoteAvailability(value: number | null | undefined, asOf: string | null | undefined, maxAge: number, now = Date.now()) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "unavailable";
  const timestamp = asOf ? Date.parse(asOf) : NaN;
  if (!Number.isFinite(timestamp) || timestamp > now + 5 * 60_000) return "timestamp-unavailable";
  return now - timestamp > maxAge ? "older-reference" : "provider-reported";
}
