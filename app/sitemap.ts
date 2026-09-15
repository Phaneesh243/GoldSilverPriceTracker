import type { MetadataRoute } from "next";
import { metalsRouteManifest } from "../lib/metals-routes";
import { metalsGuides } from "../lib/metals-guides";
import { metalTools } from "../lib/metals-calculators";
import { siteUrl } from "../lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
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
    "/about",
    "/disclaimer",
    "/privacy",
    "/contact",
  ];
  const cityPages: string[] = []; // Unverified city quotations stay crawlable but noindex.

  const paths = [...new Set([...corePages, ...cityPages, "/metals/learn", "/metals/calculators", ...Object.keys(metalsGuides).map(slug => `/metals/learn/${slug}`), ...Object.keys(metalTools).map(slug => `/calculators/${slug}`)])].filter(path => !path.endsWith("-price-last-10-days"));
  return [...new Set([...paths, ...metalsRouteManifest.filter(r => r.sitemap).map(r => r.url)])].map((path) => ({
    url: siteUrl + path,
    lastModified: metalsRouteManifest.find(r => r.url === path)?.updatedAt,
    changeFrequency: path === "/" || path.startsWith("/gold-price/") ? "hourly" as const : "weekly" as const,
    priority: path === "/" ? 1 : path.startsWith("/gold-price/") ? 0.85 : 0.7,
  }));
}
