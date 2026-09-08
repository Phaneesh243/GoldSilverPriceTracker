import type { MetalKey } from "./metals";
export const referenceInstruments = {
  gold: { symbol: "XAU", divisor: 31.1034768, originalUnit: "troy-ounce", basis: "derived-reference", formula: "USD per troy ounce × USD/INR ÷ 31.1034768" },
  silver: { symbol: "XAG", divisor: 31.1034768, originalUnit: "troy-ounce", basis: "derived-reference", formula: "USD per troy ounce × USD/INR ÷ 31.1034768" },
  platinum: { symbol: "XPT", divisor: 31.1034768, originalUnit: "troy-ounce", basis: "derived-reference", formula: "USD per troy ounce × USD/INR ÷ 31.1034768" },
  // HG standard quotation: USD/lb. Provider omits contract month and explicit units;
  // disclose this convention, never present the result as Indian spot/scrap copper.
  copper: { symbol: "HG", divisor: 0.45359237, originalUnit: "pound", basis: "derived-benchmark", formula: "USD per pound × USD/INR ÷ 0.45359237 (standard HG convention)" },
} as const;
export type ReferenceProvenance = { originalPrice: number; originalCurrency: "USD"; originalUnit: "troy-ounce" | "pound"; fxRate: number; fxDate: string; fxSource: string; formula: string };
export function normalizeReference(key: MetalKey, raw: unknown, fxRaw: unknown, fetchedAt: string, now = Date.now()) {
  const instrument = referenceInstruments[key];
  const quote = raw as { symbol?: string; currency?: string; price?: number; updatedAt?: string };
  const fx = fxRaw as { base?: string; date?: string; rates?: { INR?: number } };
  if (!instrument || !quote || quote.symbol !== instrument.symbol || quote.currency !== "USD" || typeof quote.price !== "number" || !Number.isFinite(quote.price) || quote.price <= 0 || quote.price > 1e8) throw new Error("Invalid quote");
  if (!fx || fx.base !== "USD" || typeof fx.rates?.INR !== "number" || !Number.isFinite(fx.rates.INR) || fx.rates.INR <= 0 || fx.rates.INR > 1e5 || !/^\d{4}-\d{2}-\d{2}$/.test(fx.date || "")) throw new Error("Invalid FX");
  const fxTime = Date.parse(fx.date! + "T00:00:00Z");
  const observed = quote.updatedAt ? Date.parse(quote.updatedAt) : NaN;
  if (!Number.isFinite(fxTime) || new Date(fxTime).toISOString().slice(0, 10) !== fx.date || fxTime > now + 86400000 || (Number.isFinite(observed) && observed > now + 300000)) throw new Error("Invalid future date");
  const observedAt = Number.isFinite(observed) ? new Date(observed).toISOString() : null;
  const age = observedAt ? now - observed : Infinity;
  const unusable = !observedAt || age > 72 * 3600000 || now - fxTime > 7 * 86400000;
  const freshness = unusable ? (observedAt ? "unavailable" : "unknown") : age > 20 * 60000 || now - fxTime > 4 * 86400000 ? "stale" : "fresh";
  const price = unusable ? null : quote.price * fx.rates.INR / instrument.divisor;
  return { price, observedAt, fetchedAt, freshness: freshness as "fresh" | "stale" | "unknown" | "unavailable", status: price === null ? "unavailable" as const : "available" as const,
    message: (unusable ? "Observation time missing or price/FX too old to use. " : freshness === "stale" ? "Stale reference. Verify independently before using. " : "") + (key === "copper" ? "HG provider benchmark converted using the standard USD-per-pound convention. Provider does not supply explicit units or contract month. Not an Indian spot, dealer or scrap quote; verify independently." : "Converted fine-metal reference; excludes retail charges, taxes and local premiums."),
    provenance: { originalPrice: quote.price, originalCurrency: "USD", originalUnit: instrument.originalUnit, fxRate: fx.rates.INR, fxDate: fx.date!, fxSource: "Frankfurter daily reference", formula: instrument.formula } as ReferenceProvenance };
}
export function goldSilverRatio(quotes: { key: string; price: number | null; observedAt: string | null; freshness: string; basis: string; currency: string; unitLabel: string }[]) {
  const a = quotes.find(x => x.key === "gold"), b = quotes.find(x => x.key === "silver");
  if (!a || !b || !a.price || !b.price || a.freshness !== "fresh" || b.freshness !== "fresh" || a.currency !== b.currency || a.basis !== b.basis || a.unitLabel !== b.unitLabel || !a.observedAt || !b.observedAt || Math.abs(Date.parse(a.observedAt) - Date.parse(b.observedAt)) > 300000) return null;
  return a.price / b.price;
}
