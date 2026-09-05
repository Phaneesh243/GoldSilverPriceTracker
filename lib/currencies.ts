export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "AED" | "SGD" | "AUD" | "CAD" | "JPY";

export type CurrencyDefinition = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimals: number;
};

export type CurrencyPair = {
  base: CurrencyCode;
  quote: CurrencyCode;
  symbol: string;
  slug: string;
  name: string;
  market: "major" | "inr";
};

export type CurrencyRate = {
  pair: CurrencyPair;
  rate: number | null;
  previousRate: number | null;
  changeAmount: number | null;
  changePercentage: number | null;
  status: "available" | "unavailable";
  timestamp: string | null;
  source: string;
  sourceUrl: string;
};

export type CurrencyHistoryPoint = { date: string; close: number };

export type CurrencyHistoryResult = {
  pair: CurrencyPair;
  period: string;
  status: "available" | "unavailable";
  data: CurrencyHistoryPoint[];
  timestamp: string | null;
  source: string;
  sourceUrl: string;
};

export const currencyDefinitions: CurrencyDefinition[] = [
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 2 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", decimals: 2 },
  { code: "EUR", name: "Euro", symbol: "€", decimals: 4 },
  { code: "GBP", name: "British Pound", symbol: "£", decimals: 4 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", decimals: 2 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", decimals: 2 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", decimals: 4 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimals: 4 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", decimals: 2 },
];

const pair = (base: CurrencyCode, quote: CurrencyCode, market: CurrencyPair["market"]): CurrencyPair => {
  const baseName = currencyDefinitions.find((item) => item.code === base)?.name ?? base;
  const quoteName = currencyDefinitions.find((item) => item.code === quote)?.name ?? quote;
  return { base, quote, symbol: `${base}/${quote}`, slug: `${base.toLowerCase()}-${quote.toLowerCase()}`, name: `${baseName} / ${quoteName}`, market };
};

export const currencyPairs: CurrencyPair[] = [
  pair("USD", "INR", "inr"),
  pair("EUR", "INR", "inr"),
  pair("GBP", "INR", "inr"),
  pair("AED", "INR", "inr"),
  pair("SGD", "INR", "inr"),
  pair("AUD", "INR", "inr"),
  pair("CAD", "INR", "inr"),
  pair("JPY", "INR", "inr"),
  pair("EUR", "USD", "major"),
  pair("GBP", "USD", "major"),
  pair("USD", "JPY", "major"),
];

export const currencyCodes = currencyDefinitions.map((item) => item.code);

export function getCurrency(code: string | null | undefined) {
  return currencyDefinitions.find((item) => item.code === code?.toUpperCase()) ?? currencyDefinitions[0];
}

export function getCurrencyPair(value: string | null | undefined) {
  const normalized = value?.toLowerCase().replace("/", "-") ?? "";
  const configured = currencyPairs.find((item) => item.slug === normalized || item.symbol.toLowerCase() === value?.toLowerCase());
  if (configured) return configured;
  const [base, quote] = normalized.split("-").map((item) => item.toUpperCase());
  if (!isCurrencyCode(base) || !isCurrencyCode(quote) || base === quote) return null;
  return pair(base, quote, quote === "INR" ? "inr" : "major");
}

export function isCurrencyCode(value: string | null | undefined): value is CurrencyCode {
  return currencyCodes.includes(value?.toUpperCase() as CurrencyCode);
}

export function formatCurrencyRate(value: number | null, pairValue: CurrencyPair) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  const decimals = pairValue.base === "JPY" || pairValue.quote === "JPY" ? 2 : pairValue.base === "USD" && pairValue.quote === "INR" ? 2 : 4;
  return value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
