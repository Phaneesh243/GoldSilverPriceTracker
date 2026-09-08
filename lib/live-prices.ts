import { getCountry } from "./country-data";
import { getCityRate, liveDataSource } from "./market-data";

const GOODRETURNS_GOLD_URL = "https://www.goodreturns.in/gold-rates/";
const GOODRETURNS_SILVER_URL = "https://www.goodreturns.in/silver-rates/";
const TROY_OUNCE_GRAMS = 31.1034768;
const UPSTREAM_TIMEOUT_MS = 10_000;

type XausSpotResponse = {
  xau?: { price?: number };
  silver_usd_oz?: number;
  fx_rate?: number;
  updated_at?: string;
  price_as_of?: string;
  source?: string;
  stale?: boolean;
};

type XausIntradayResponse = {
  points?: Array<{ t: string | number; p: number }>;
  data_state?: { status?: "fresh" | "stale" | "unavailable" };
};

export type LivePricePayload = {
  city: string;
  slug: string;
  country: string;
  countryCode: string;
  currency: string;
  updatedAt: string;
  selectedDateLabel: string;
  source: string;
  sourceUrl: string;
  isLive: true;
  stale: boolean;
  gold: Array<{
    purity: "24K" | "22K" | "18K";
    pricePerGram: number;
    changeAmount: number;
    changePercentage: number;
  }>;
  silver: {
    pricePerGram: number;
    changeAmount: number;
    changePercentage: number;
  };
};

export type LiveHistoryPayload = {
  metal: "gold" | "silver";
  source: string;
  stale: boolean;
  data: Array<{ date: string | number; value: number }>;
};

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&#x20b9;|&#8377;/gi, "\u20b9")
    .replace(/&percnt;|&#37;/gi, "%")
    .replace(/&amp;/gi, "&")
    .replace(/&rsquo;|&#8217;/gi, "'")
    .replace(/&mdash;|&#8212;/gi, "-");
}

function toText(html: string) {
  return decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function moneyToNumber(value?: string) {
  if (!value) {
    return 0;
  }

  return Number(value.replace(/[^\d.-]/g, ""));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function sourceSlug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function percent(change: number, current: number) {
  const previous = current - change;
  return previous ? Math.round((change / previous) * 10000) / 100 : 0;
}

function getDateLabel(text: string) {
  const match = text.match(/\b(\d{1,2}\s+[A-Z][a-z]+\s+\d{4})\b/);

  if (!match) {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeZone: "Asia/Kolkata",
    }).format(new Date());
  }

  return match[1];
}

function selectedDateLabel(date?: string) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (!date || date === today) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00+05:30`));
}

async function fetchGoodreturnsText(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-IN,en;q=0.9",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Goodreturns responded with ${response.status}`);
  }

  return toText(await response.text());
}

async function fetchGlobalSpot(countryCode: string) {
  const country = getCountry(countryCode);
  const response = await fetch(`https://xaus.com/api/v1/spot?currency=${country.currency}&unit=gram&compact=1`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Global metal feed responded with ${response.status}`);
  }

  const spot = (await response.json()) as XausSpotResponse;

  if (!spot.xau?.price || !spot.silver_usd_oz || !spot.fx_rate) {
    throw new Error("Global metal feed missed required fields.");
  }

  const gold24 = roundMoney(spot.xau.price);
  const silver = roundMoney((spot.silver_usd_oz * spot.fx_rate) / TROY_OUNCE_GRAMS);

  return {
    country,
    gold24,
    gold22: roundMoney(gold24 * (22 / 24)),
    gold18: roundMoney(gold24 * 0.75),
    silver,
    updatedAt: new Intl.DateTimeFormat(country.locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(spot.price_as_of || spot.updated_at || Date.now())),
    stale: Boolean(spot.stale),
  };
}

function parseGoldCity(text: string) {
  const introMatch = text.match(/stands at\s+\u20b9\s*([\d,]+)\s+per gram for 24 karat gold[\s\S]*?\u20b9\s*([\d,]+)\s+per gram for 22 karat gold[\s\S]*?\u20b9\s*([\d,]+)\s+per gram for 18 karat gold/i);

  if (!introMatch) {
    throw new Error("Could not parse Goodreturns city gold rates.");
  }

  return {
    gold24: moneyToNumber(introMatch[1]),
    gold22: moneyToNumber(introMatch[2]),
    gold18: moneyToNumber(introMatch[3]),
  };
}

function parseSilverCity(text: string) {
  const introMatch = text.match(/price of silver in .*? today is\s+\u20b9\s*([\d,]+)\s+per gram/i);

  if (!introMatch) {
    throw new Error("Could not parse Goodreturns city silver rates.");
  }

  return {
    perGram: moneyToNumber(introMatch[1]),
  };
}

function parseGoldHistory(text: string) {
  const rows = [...text.matchAll(/([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})\s+\u20b9\s*([\d,]+)\s*\(([+-]?\d[\d,]*)\)\s+\u20b9\s*([\d,]+)\s*\(([+-]?\d[\d,]*)\)/g)];

  return rows.slice(0, 10).reverse().map((row) => ({
    date: row[1],
    value: moneyToNumber(row[2]),
  }));
}

function parseSilverHistory(text: string) {
  const rows = [...text.matchAll(/([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})\s+\u20b9\s*([\d,]+)\s+\u20b9\s*([\d,]+)\s+\u20b9\s*([\d,]+)/g)];

  return rows.slice(0, 10).reverse().map((row) => ({
    date: row[1],
    value: moneyToNumber(row[4]) / 1000,
  }));
}

function periodHours(period?: string) {
  switch (period) {
    case "7d":
      return 168;
    case "1m":
      return 720;
    case "6m":
      return 4320;
    case "1y":
      return 8760;
    default:
      return 24;
  }
}

function trimIndianHistory(data: LiveHistoryPayload["data"], period?: string) {
  switch (period) {
    case "1d":
      return data.slice(-2);
    case "7d":
      return data.slice(-7);
    default:
      return data;
  }
}

export async function getLiveCityPrices(citySlug?: string, countryCode = "IN", date?: string): Promise<LivePricePayload> {
  if (process.env.METALS_LEGACY_RETAIL_RIGHTS_CONFIRMED !== "true") throw new Error("Retail feed disabled pending source reuse rights verification.");
  const country = getCountry(countryCode);

  if (country.code !== "IN") {
    const global = await fetchGlobalSpot(country.code);

    return {
      city: global.country.name,
      slug: global.country.code.toLowerCase(),
      country: global.country.name,
      countryCode: global.country.code,
      currency: global.country.currency,
      updatedAt: global.updatedAt,
      selectedDateLabel: selectedDateLabel(date),
      source: "Global spot metal feed",
      sourceUrl: "https://xaus.com/api/",
      isLive: true,
      stale: global.stale,
      gold: [
        { purity: "24K", pricePerGram: global.gold24, changeAmount: 0, changePercentage: 0 },
        { purity: "22K", pricePerGram: global.gold22, changeAmount: 0, changePercentage: 0 },
        { purity: "18K", pricePerGram: global.gold18, changeAmount: 0, changePercentage: 0 },
      ],
      silver: { pricePerGram: global.silver, changeAmount: 0, changePercentage: 0 },
    };
  }

  const city = getCityRate(citySlug);
  const goodreturnsSlug = sourceSlug(city.sourceName);
  const goldUrl = `${GOODRETURNS_GOLD_URL}${goodreturnsSlug}.html`;
  const silverUrl = `${GOODRETURNS_SILVER_URL}${goodreturnsSlug}.html`;
  const [goldText, silverText] = await Promise.all([fetchGoodreturnsText(goldUrl), fetchGoodreturnsText(silverUrl)]);
  const gold = parseGoldCity(goldText);
  const silver = parseSilverCity(silverText);
  const goldHistory = parseGoldHistory(goldText);
  const silverHistory = parseSilverHistory(silverText);
  const previousGold24 = goldHistory.at(-2)?.value ?? gold.gold24;
  const previousGold22 = goldHistory.at(-2)?.value ? Math.round(goldHistory.at(-2)!.value * (22 / 24)) : gold.gold22;
  const previousGold18 = goldHistory.at(-2)?.value ? Math.round(goldHistory.at(-2)!.value * 0.75) : gold.gold18;
  const previousSilver = silverHistory.at(-2)?.value ?? silver.perGram;
  const gold24Change = gold.gold24 - previousGold24;
  const gold22Change = gold.gold22 - previousGold22;
  const gold18Change = gold.gold18 - previousGold18;
  const silverChange = silver.perGram - previousSilver;
  const updatedAt = getDateLabel(goldText);

  return {
    city: city.name,
    slug: city.slug,
    country: country.name,
    countryCode: country.code,
    currency: country.currency,
    updatedAt,
    selectedDateLabel: selectedDateLabel(date),
    source: `${liveDataSource} daily city rates`,
    sourceUrl: goldUrl,
    isLive: true,
    stale: false,
    gold: [
      { purity: "24K", pricePerGram: gold.gold24, changeAmount: gold24Change, changePercentage: percent(gold24Change, gold.gold24) },
      { purity: "22K", pricePerGram: gold.gold22, changeAmount: gold22Change, changePercentage: percent(gold22Change, gold.gold22) },
      { purity: "18K", pricePerGram: gold.gold18, changeAmount: gold18Change, changePercentage: percent(gold18Change, gold.gold18) },
    ],
    silver: {
      pricePerGram: silver.perGram,
      changeAmount: silverChange,
      changePercentage: percent(silverChange, silver.perGram),
    },
  };
}

export async function getLiveHistory(metal: "gold" | "silver", countryCode = "IN", period = "1d"): Promise<LiveHistoryPayload> {
  if (process.env.METALS_LEGACY_RETAIL_RIGHTS_CONFIRMED !== "true") throw new Error("Legacy history disabled pending source reuse rights verification.");
  const country = getCountry(countryCode);

  if (country.code !== "IN") {
    const symbol = metal === "silver" ? "xag" : "xau";
    const [historyResponse, spotResponse] = await Promise.all([
      fetch(`https://xaus.com/api/v1/intraday?symbol=${symbol}&hours=${periodHours(period)}`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        next: { revalidate: 600 },
      }),
      fetch(`https://xaus.com/api/v1/spot?currency=${country.currency}&unit=gram&compact=1`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        next: { revalidate: 600 },
      }),
    ]);

    if (!historyResponse.ok || !spotResponse.ok) {
      throw new Error("Global history feed unavailable.");
    }

    const history = (await historyResponse.json()) as XausIntradayResponse;
    const spot = (await spotResponse.json()) as XausSpotResponse;

    if (!history.points?.length || !spot.fx_rate) {
      throw new Error("Global history feed missed required fields.");
    }

    return {
      metal,
      source: "Global spot metal history",
      stale: history.data_state?.status === "stale",
      data: history.points.map((point) => ({
        date: point.t,
        value: roundMoney((point.p * (spot.fx_rate as number)) / TROY_OUNCE_GRAMS),
      })),
    };
  }

  const text = await fetchGoodreturnsText(metal === "gold" ? GOODRETURNS_GOLD_URL : GOODRETURNS_SILVER_URL);
  const data = trimIndianHistory(metal === "gold" ? parseGoldHistory(text) : parseSilverHistory(text), period);

  if (!data.length) {
    throw new Error(`Could not parse Goodreturns ${metal} history.`);
  }

  return {
    metal,
    source: `${liveDataSource} last 10 daily rates`,
    stale: false,
    data,
  };
}
