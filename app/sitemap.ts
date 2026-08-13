import type { MetadataRoute } from "next";
import { cityRates } from "../lib/market-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://goldsilverprices.in";
  const corePages = [
    "/",
    "/gold-price-today",
    "/silver-price-today",
    "/platinum-price-today",
    "/copper-price-today",
    "/gold-price-last-10-days",
    "/silver-price-last-10-days",
    "/platinum-price-last-10-days",
    "/copper-price-last-10-days",
    "/metal-comparison",
    "/investment-return-calculator",
    "/historical-prices",
    "/calculator",
    "/about",
    "/disclaimer",
    "/privacy",
    "/contact",
  ];
  const cityPages = cityRates.map((city) => `/gold-price/${city.slug}`);

  return [...corePages, ...cityPages].map((path) => ({
    url: base + path,
    lastModified: new Date(),
    changeFrequency: path === "/" || path.startsWith("/gold-price/") ? "hourly" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/gold-price/") ? 0.85 : 0.7,
  }));
}
