import type { MetadataRoute } from "next";
import { metalsGuides } from "../lib/metals-guides";
import { metalTools } from "../lib/metals-calculators";
import { currencyPairs } from "../lib/currencies";
import { insuranceCategories, insuranceProviders } from "../lib/insurance";
import { fundCategories, mutualFunds } from "../lib/mutual-funds";
import { cryptoAssets, cryptoCategories } from "../lib/crypto";
import { indianStocks } from "../lib/indian-stocks";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://goldsilverprices.in").replace(/\/$/, "");
  const corePages = [
    "/",
    "/metals",
    "/gold-price-today",
    "/silver-price-today",
    "/platinum-price-today",
    "/copper-price-today",
    "/gold-price-last-10-days",
    "/silver-price-last-10-days",
    "/platinum-price-last-10-days",
    "/copper-price-last-10-days",
    "/metal-comparison",
    "/calculators",
    "/calculators/gold",
    "/calculators/silver",
    "/calculators/platinum",
    "/calculators/copper",
    "/calculators/gold-jewellery",
    "/calculators/purity-converter",
    "/calculators/weight-converter",
    "/calculators/investment-return",
    "/calculators/sip",
    "/calculators/cagr",
    "/calculators/emi",
    "/calculators/currency",
    "/currencies",
    "/calculators/tax",
    "/news",
    "/news/metals",
    "/news/gold",
    "/news/silver",
    "/news/platinum",
    "/news/copper",
    "/news/markets",
    "/news/investing",
    "/news/analysis",
    "/news/stocks",
    "/news/crypto",
    "/news/funds",
    "/news/insurance",
    "/news/bonds",
    "/bonds",
    "/bonds/explore",
    "/bonds/compare",
    "/bonds/providers",
    "/bonds/calculators",
    "/bonds/government-bonds",
    "/bonds/treasury-bills",
    "/bonds/corporate-bonds",
    "/bonds/tax-free-bonds",
    "/bonds/green-bonds",
    "/news/currencies",
    "/insurance",
    "/insurance/compare",
    "/insurance/providers",
    "/insurance/calculators",
    "/insurance/claims",
    "/insurance/renewal",
    "/mutual-funds",
    "/mutual-funds/explore",
    "/mutual-funds/compare",
    "/mutual-funds/providers",
    "/mutual-funds/calculators",
    "/mutual-funds/learn",
    "/mutual-funds/tax",
    "/crypto",
    "/crypto/explore",
    "/crypto/compare",
    "/crypto/exchanges",
    "/crypto/calculators",
    "/crypto/tax",
    "/crypto/learn",
    "/crypto/regulation",
    "/crypto/security",
    "/crypto/defi",
    "/crypto/staking",
    "/crypto/nft",
    "/crypto/news",
    "/stocks",
    "/stocks/explore",
    "/stocks/screener",
    "/stocks/compare",
    "/stocks/nifty-50",
    "/stocks/top-10",
    "/stocks/under-10",
    "/stocks/under-50",
    "/stocks/under-100",
    "/stocks/ipo",
    "/stocks/results",
    "/stocks/corporate-actions",
    "/stocks/news",
    "/stocks/brokers",
    "/stocks/exchanges",
    "/stocks/sebi",
    "/stocks/learn",
    "/stocks/calculators",
    "/about",
    "/disclaimer",
    "/privacy",
    "/contact",
  ];
  const cityPages: string[] = []; // Unverified city quotations stay crawlable but noindex.
  const currencyPages = currencyPairs.map((pair) => `/currencies/${pair.slug}`);
  const insuranceCategoryPages = insuranceCategories.map((category) => category.route);
  const insuranceProviderPages = insuranceProviders.map((provider) => `/insurance/providers/${provider.slug}`);
  const fundCategoryPages = fundCategories.map((category) => category.route);
  const fundPages = mutualFunds.map((fund) => `/mutual-funds/${fund.slug}`);
  const cryptoCategoryPages = cryptoCategories.map((category) => category.route);
  const cryptoPages = cryptoAssets.map((asset) => `/crypto/${asset.slug}`);
  const stockPages = indianStocks.map((stock) => `/stocks/${stock.slug}`);

  const paths = [...new Set([...corePages, ...cityPages, ...currencyPages, ...insuranceCategoryPages, ...insuranceProviderPages, ...fundCategoryPages, ...fundPages, ...cryptoCategoryPages, ...cryptoPages, ...stockPages, "/metals/learn", "/metals/calculators", ...Object.keys(metalsGuides).map(slug => `/metals/learn/${slug}`), ...Object.keys(metalTools).map(slug => `/calculators/${slug}`)])].filter(path => !path.endsWith("-price-last-10-days"));
  return paths.map((path) => ({
    url: base + path,
    changeFrequency: path === "/" || path.startsWith("/gold-price/") ? "hourly" as const : "weekly" as const,
    priority: path === "/" ? 1 : path.startsWith("/gold-price/") ? 0.85 : 0.7,
  }));
}
