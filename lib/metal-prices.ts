import { getCountry } from "./country-data";
import { getLiveCityPrices, getLiveHistory } from "./live-prices";
import { getCityRate } from "./market-data";
import { getMetalConfig, metals, type MetalKey, type MetalStatus } from "./metals";

const TROY_OUNCE_GRAMS = 31.1034768;
const POUND_KG = 0.45359237;
const GOLD_API_BASE = "https://api.gold-api.com";
const UPSTREAM_TIMEOUT_MS = 10_000;

type GoldApiPrice = {
  currency?: string;
  currencySymbol?: string;
  exchangeRate?: number;
  name?: string;
  price?: number;
  symbol?: string;
  updatedAt?: string;
  updatedAtReadable?: string;
};

export type MetalPrice = {
  key: MetalKey;
  name: string;
  symbol: string;
  route: string;
  last10Route: string;
  unitLabel: string;
  price: number | null;
  pricePerGram?: number | null;
  pricePerKg?: number | null;
  changeAmount: number | null;
  changePercentage: number | null;
  status: MetalStatus;
  message?: string;
  currency: string;
  updatedAt: string;
  source: string;
  sourceUrl: string;
  variants?: Array<{ label: string; price: number; changeAmount: number; changePercentage: number }>;
};

export type MetalHistoryPoint = {
  date: string | number;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  change?: number;
  changePercentage?: number;
};

export type MetalHistoryResult = {
  metal: MetalKey;
  source: string;
  status: MetalStatus;
  message?: string;
  data: MetalHistoryPoint[];
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function unavailableMetal(key: MetalKey, currency: string, message: string): MetalPrice {
  const config = getMetalConfig(key);

  return {
    key,
    name: config.name,
    symbol: config.symbol,
    route: config.route,
    last10Route: config.last10Route,
    unitLabel: config.unitLabel,
    price: null,
    pricePerGram: config.unit === "gram" ? null : undefined,
    pricePerKg: config.unit === "kg" ? null : undefined,
    changeAmount: null,
    changePercentage: null,
    status: "unavailable",
    message,
    currency,
    updatedAt: new Date().toISOString(),
    source: "Unavailable",
    sourceUrl: "",
  };
}

async function fetchGoldApiPrice(symbol: "XPT" | "HG", currency: string) {
  const response = await fetch(`${GOLD_API_BASE}/price/${symbol}/${currency}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Metal feed responded with ${response.status}`);
  }

  const payload = (await response.json()) as GoldApiPrice;
  if (!payload.price || !Number.isFinite(payload.price)) {
    throw new Error("Metal feed missed price.");
  }

  return payload;
}

async function getGoldAndSilver(citySlug: string, countryCode: string) {
  const live = await getLiveCityPrices(citySlug, countryCode);
  const gold24 = live.gold.find((item) => item.purity === "24K");
  const gold22 = live.gold.find((item) => item.purity === "22K");
  const gold18 = live.gold.find((item) => item.purity === "18K");

  const gold: MetalPrice = {
    key: "gold",
    name: "Gold",
    symbol: "Au",
    route: "/gold-price-today",
    last10Route: "/gold-price-last-10-days",
    unitLabel: "per gram",
    price: gold22?.pricePerGram ?? gold24?.pricePerGram ?? null,
    pricePerGram: gold22?.pricePerGram ?? gold24?.pricePerGram ?? null,
    changeAmount: gold22?.changeAmount ?? gold24?.changeAmount ?? null,
    changePercentage: gold22?.changePercentage ?? gold24?.changePercentage ?? null,
    status: gold22 || gold24 ? "available" : "unavailable",
    currency: live.currency,
    updatedAt: live.updatedAt,
    source: live.source,
    sourceUrl: live.sourceUrl,
    variants: live.gold.map((item) => ({
      label: item.purity,
      price: item.pricePerGram,
      changeAmount: item.changeAmount,
      changePercentage: item.changePercentage,
    })),
  };

  const silver: MetalPrice = {
    key: "silver",
    name: "Silver",
    symbol: "Ag",
    route: "/silver-price-today",
    last10Route: "/silver-price-last-10-days",
    unitLabel: "per gram",
    price: live.silver.pricePerGram,
    pricePerGram: live.silver.pricePerGram,
    changeAmount: live.silver.changeAmount,
    changePercentage: live.silver.changePercentage,
    status: "available",
    currency: live.currency,
    updatedAt: live.updatedAt,
    source: live.source,
    sourceUrl: live.sourceUrl,
  };

  return { live, gold, silver };
}

async function getPlatinumOrCopper(key: "platinum" | "copper", currency: string): Promise<MetalPrice> {
  const config = getMetalConfig(key);
  const symbol = config.apiSymbol;

  if (symbol !== "XPT" && symbol !== "HG") {
    return unavailableMetal(key, currency, "No free live provider is configured for this metal.");
  }

  const payload = await fetchGoldApiPrice(symbol, currency);
  const pricePerGram = symbol === "XPT" ? roundMoney(payload.price! / TROY_OUNCE_GRAMS) : undefined;
  const pricePerKg = symbol === "HG" ? roundMoney(payload.price! / POUND_KG) : undefined;
  const price = key === "platinum" ? pricePerGram ?? null : pricePerKg ?? null;

  return {
    key,
    name: config.name,
    symbol: config.symbol,
    route: config.route,
    last10Route: config.last10Route,
    unitLabel: config.unitLabel,
    price,
    pricePerGram: pricePerGram ?? null,
    pricePerKg: pricePerKg ?? null,
    changeAmount: null,
    changePercentage: null,
    status: "available",
    currency,
    updatedAt: payload.updatedAt || new Date().toISOString(),
    source: "Gold-API live metal price",
    sourceUrl: "https://gold-api.com/docs",
  };
}

export async function getAllMetalPrices(citySlug = "mumbai", countryCode = "IN") {
  const country = getCountry(countryCode);
  const city = getCityRate(citySlug);
  const result: MetalPrice[] = [];

  const goldSilver = await getGoldAndSilver(city.slug, country.code).catch(() => null);
  if (goldSilver) {
    result.push(goldSilver.gold, goldSilver.silver);
  } else {
    result.push(
      unavailableMetal("gold", country.currency, "Gold price feed is temporarily unavailable."),
      unavailableMetal("silver", country.currency, "Silver price feed is temporarily unavailable."),
    );
  }

  const extraMetals = await Promise.allSettled([
    getPlatinumOrCopper("platinum", country.currency),
    getPlatinumOrCopper("copper", country.currency),
  ]);

  for (const [index, settled] of extraMetals.entries()) {
    const key = index === 0 ? "platinum" : "copper";
    result.push(
      settled.status === "fulfilled"
        ? settled.value
        : unavailableMetal(key, country.currency, `${getMetalConfig(key).name} live price is temporarily unavailable.`),
    );
  }

  return {
    city: city.name,
    slug: city.slug,
    country: country.name,
    countryCode: country.code,
    currency: country.currency,
    updatedAt: new Date().toISOString(),
    metals: metals.map((config) => result.find((item) => item.key === config.key) ?? unavailableMetal(config.key, country.currency, "Unavailable.")),
  };
}

export async function getMetalPrice(key: MetalKey, citySlug = "mumbai", countryCode = "IN") {
  const all = await getAllMetalPrices(citySlug, countryCode);
  return all.metals.find((metal) => metal.key === key) ?? unavailableMetal(key, all.currency, "Metal is unavailable.");
}

export async function getMetalHistory(key: MetalKey, countryCode = "IN", period = "1d"): Promise<MetalHistoryResult> {
  if (key === "gold" || key === "silver") {
    try {
      const history = await getLiveHistory(key, countryCode, period);
      return {
        metal: key,
        source: history.source,
        status: "available",
        data: history.data.map((point, index, list) => {
          const previous = index > 0 ? list[index - 1].value : point.value;
          const change = roundMoney(point.value - previous);
          return {
            date: point.date,
            close: point.value,
            change,
            changePercentage: previous ? roundMoney((change / previous) * 100) : 0,
          };
        }),
      };
    } catch {
      return {
        metal: key,
        source: "Goodreturns",
        status: "unavailable",
        message: `${getMetalConfig(key).name} history is temporarily unavailable.`,
        data: [],
      };
    }
  }

  return {
    metal: key,
    source: "Gold-API free current endpoint",
    status: "unavailable",
    message: `${getMetalConfig(key).name} historical prices require a historical data provider. Current live price is available, but GoldSilverPrices will not create fake history.`,
    data: [],
  };
}
