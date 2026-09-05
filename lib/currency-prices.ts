import { currencyPairs, getCurrencyPair, type CurrencyHistoryPoint, type CurrencyHistoryResult, type CurrencyPair, type CurrencyRate } from "./currencies";

const BASE_URL = (process.env.CURRENCY_API_BASE_URL || "https://api.frankfurter.app").replace(/\/$/, "");
const SOURCE = "Frankfurter reference FX feed";
const SOURCE_URL = "https://www.frankfurter.app/";

type LatestResponse = { amount?: number; base?: string; date?: string; rates?: Record<string, number> };
type HistoricalResponse = { base?: string; start_date?: string; end_date?: string; rates?: Record<string, Record<string, number>> };

function round(value: number, digits = 8) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function dateDaysAgo(period: string) {
  const days = period === "1d" ? 2 : period === "7d" ? 9 : period === "30d" ? 35 : period === "90d" ? 100 : 370;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function pairRate(payload: LatestResponse, pair: CurrencyPair) {
  if (pair.base === pair.quote) return 1;
  if (pair.base === payload.base && payload.rates?.[pair.quote]) return payload.rates[pair.quote];
  if (pair.quote === payload.base && payload.rates?.[pair.base]) return 1 / payload.rates[pair.base];
  const baseRate = pair.base === payload.base ? 1 : payload.rates?.[pair.base];
  const quoteRate = pair.quote === payload.base ? 1 : payload.rates?.[pair.quote];
  if (baseRate && quoteRate) return quoteRate / baseRate;
  return null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Currency provider responded with ${response.status}.`);
  return (await response.json()) as T;
}

function unavailable(pair: CurrencyPair, message?: string): CurrencyRate {
  return { pair, rate: null, previousRate: null, changeAmount: null, changePercentage: null, status: "unavailable", timestamp: null, source: message || SOURCE, sourceUrl: SOURCE_URL };
}

export async function getCurrencyRates(selectedPairs = currencyPairs): Promise<CurrencyRate[]> {
  const currencies = [...new Set(selectedPairs.flatMap((item) => [item.base, item.quote]))].filter((code) => code !== "EUR");
  const requestedBase = "EUR";
  try {
    const payload = await fetchJson<LatestResponse>(`${BASE_URL}/latest?from=${requestedBase}&to=${currencies.join(",")}`);
    const previousDate = new Date();
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    const previous = await fetchJson<LatestResponse>(`${BASE_URL}/${previousDate.toISOString().slice(0, 10)}?from=${requestedBase}&to=${currencies.join(",")}`).catch(() => null);
    return selectedPairs.map((item) => {
      const rate = pairRate(payload, item);
      const previousRate = previous ? pairRate(previous, item) : null;
      const changeAmount = rate !== null && previousRate !== null ? round(rate - previousRate) : null;
      return { pair: item, rate, previousRate, changeAmount, changePercentage: changeAmount !== null && previousRate ? round((changeAmount / previousRate) * 100, 4) : null, status: rate !== null ? "available" : "unavailable", timestamp: payload.date || null, source: SOURCE, sourceUrl: SOURCE_URL };
    });
  } catch (error) {
    return selectedPairs.map((item) => unavailable(item, error instanceof Error ? error.message : undefined));
  }
}

export async function getCurrencyHistory(pair: CurrencyPair, period = "30d"): Promise<CurrencyHistoryResult> {
  try {
    const start = dateDaysAgo(period);
    const end = new Date().toISOString().slice(0, 10);
    const payload = await fetchJson<HistoricalResponse>(`${BASE_URL}/${start}..${end}?from=${pair.base}&to=${pair.quote}`);
    const data: CurrencyHistoryPoint[] = Object.entries(payload.rates || {}).flatMap(([date, values]) => values[pair.quote] ? [{ date, close: values[pair.quote] }] : []);
    return { pair, period, status: data.length > 1 ? "available" : "unavailable", data, timestamp: payload.end_date || end, source: SOURCE, sourceUrl: SOURCE_URL };
  } catch {
    return { pair, period, status: "unavailable", data: [], timestamp: null, source: SOURCE, sourceUrl: SOURCE_URL };
  }
}

export async function getCurrencyRate(pairValue: string) {
  const pair = getCurrencyPair(pairValue);
  if (!pair) return null;
  return (await getCurrencyRates([pair]))[0];
}
