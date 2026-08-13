import type { MetadataRoute } from "next";
import { cityRates } from "../lib/market-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://goldsilverprices.in";
  const corePages = ["/", "/gold-price-today", "/silver-price-today", "/historical-prices", "/calculator", "/about", "/disclaimer", "/privacy", "/contact"];
  const cityPages = cityRates.map((city) => `/gold-price/${city.slug}`);

  return [...corePages, ...cityPages].map((path) => ({
    url: base + path,
    lastModified: new Date(),
    changeFrequency: path === "/" || path.startsWith("/gold-price/") ? "hourly" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/gold-price/") ? 0.85 : 0.7,
  }));
}
