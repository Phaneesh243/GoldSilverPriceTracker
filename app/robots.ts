import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://goldsilverprices.in";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login", "/register", "/portfolio", "/watchlist", "/alerts", "/notifications", "/settings", "/search?"],
    },
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  };
}
