import "server-only";
import { unstable_cache } from "next/cache";
import { getMetalConfig, metals, type MetalKey, type MetalStatus } from "./metals";
import { normalizeReference, referenceInstruments, type ReferenceProvenance } from "./metals-data";
export type MetalPrice = {
  key: MetalKey; name: string; symbol: string; route: string; last10Route: string;
  unitLabel: string; price: number | null; pricePerGram?: number | null; pricePerKg?: number | null;
  changeAmount: number | null; changePercentage: number | null; status: MetalStatus;
  message?: string; currency: string; updatedAt: string; source: string; sourceUrl: string;
  instrumentId: string; basis: string; observedAt: string | null; fetchedAt: string;
  freshness: "fresh" | "stale" | "unknown" | "unavailable"; provenance?: ReferenceProvenance;
  variants?: Array<{ label: string; price: number; changeAmount: number; changePercentage: number }>;
};
export type MetalHistoryPoint = { date: string | number; close: number; open?: number; high?: number; low?: number; change?: number; changePercentage?: number };
export type MetalHistoryResult = { metal: MetalKey; source: string; status: MetalStatus; message?: string; data: MetalHistoryPoint[]; currency: string; unit: string; basis: string; requestedRange: string; actualFrom: string | null; actualTo: string | null; frequency: string; missingDates: string[] };
export function unavailableMetal(key: MetalKey, message: string): MetalPrice {
  const c = getMetalConfig(key);
  return { key, name: c.name, symbol: c.symbol, route: c.route, last10Route: c.last10Route,
    unitLabel: c.unitLabel, price: null, pricePerGram: null, pricePerKg: null,
    changeAmount: null, changePercentage: null, status: "unavailable", message,
    currency: "INR", updatedAt: "", observedAt: null, fetchedAt: new Date().toISOString(),
    source: "No enabled verified provider", sourceUrl: "", instrumentId: key + ":reference:INR:" + c.unit,
    basis: "reference", freshness: "unavailable" };
}
async function fetchJson(url: string) {
  // Fixed origins only. No client-provided upstream URLs. One bounded retry for 5xx.
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (response.status === 429) throw new Error("Provider quota reached; cached refresh will retry later.");
    if (response.ok) return response.json() as Promise<unknown>;
    console.warn("[metals-provider]", { provider: new URL(url).hostname, status: response.status });
    if (response.status < 500 || attempt === 1) throw new Error("Provider unavailable.");
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  throw new Error("Provider unavailable.");
}
const fetchFx = unstable_cache(async () => {
  try { return { data: await fetchJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR"), fetchedAt: new Date().toISOString() }; }
  catch { return { data: null, fetchedAt: new Date().toISOString() }; }
}, ["metals-fx-v2"], { revalidate: 3600 });
const fetchReference = unstable_cache(async (symbol: string) => {
  const fetchedAt = new Date().toISOString();
  try { return { data: await fetchJson("https://api.gold-api.com/price/" + symbol), fetchedAt, error: "" }; }
  catch { return { data: null, fetchedAt, error: "Reference provider unavailable or rate limited." }; }
}, ["metals-reference-v2"], { revalidate: 300 });
export async function getMetalPrice(key: MetalKey, _citySlug = "mumbai", countryCode = "IN"): Promise<MetalPrice> {
  void _citySlug; // Compatibility argument; references are never city quotations.
  if (countryCode !== "IN") return unavailableMetal(key, "This module supports INR reference values only.");
  // Gold API terms explicitly document use on your website (reviewed 2026-09-08).
  // Current attributed references only; this does not enable historical or retail scraping.
  // Preserve an operator's explicit opt-out, including the legacy permission flag.
  if (process.env.METALS_REFERENCE_FEED_ENABLED === "false" || process.env.METALS_REFERENCE_RIGHTS_CONFIRMED === "false")
    return unavailableMetal(key, "Reference feed is switched off in this deployment. Manual quotation tools remain available.");
  const instrument = referenceInstruments[key];
  const [quote, fx] = await Promise.all([fetchReference(instrument.symbol), fetchFx()]);
  if (!quote.data || !fx.data) return unavailableMetal(key, quote.error || "Daily FX provider unavailable.");
  try {
    const normalized = normalizeReference(key, quote.data, fx.data, quote.fetchedAt);
    const base = unavailableMetal(key, normalized.message);
    return { ...base, ...normalized, updatedAt: normalized.observedAt || "", pricePerGram: key === "copper" ? null : normalized.price, pricePerKg: key === "copper" ? normalized.price : null,
      source: "Gold API + Frankfurter", sourceUrl: "https://gold-api.com/docs", basis: instrument.basis,
      instrumentId: key === "copper" ? "copper:HG-benchmark:INR:kg" : key + ":fine-metal-reference:INR:gram" };
  } catch { return unavailableMetal(key, "Provider response failed unit, currency, timestamp or value validation."); }
}
export async function getAllMetalPrices(citySlug = "mumbai", countryCode = "IN") {
  const values = await Promise.all(metals.map(c => getMetalPrice(c.key, citySlug, countryCode)));
  return { city: "Not a city quotation", slug: "reference", country: "India", countryCode: "IN", currency: "INR", updatedAt: "", fetchedAt: new Date().toISOString(), metals: values };
}
export async function getMetalHistory(key: MetalKey, _countryCode = "IN", period = "10d"): Promise<MetalHistoryResult> {
  void _countryCode;
  return { metal: key, source: "No enabled historical provider", status: "unavailable",
    message: "Historical data is disabled until storage/display rights, endpoint coverage and a shared request budget are verified. No synthetic history is generated.",
    data: [], currency: "INR", unit: key === "copper" ? "kg" : "gram", basis: "reference",
    requestedRange: period, actualFrom: null, actualTo: null, frequency: "unavailable", missingDates: [] };
}
