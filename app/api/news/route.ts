import { NextResponse } from "next/server";
import { getCountry } from "../../../lib/country-data";

type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  imageUrl: string;
  imageHint: NewsImageHint;
};

type NewsImageHint = "gold-bars" | "silver-coins" | "market-chart" | "jewelry" | "city-rates" | "bullion";
type NewsMetal = "gold" | "silver" | "platinum" | "copper";

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function tagValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

function attrValue(item: string, tag: string, attr: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

function extractImageUrl(item: string) {
  const fromMedia = attrValue(item, "media:content", "url") || attrValue(item, "media:thumbnail", "url") || attrValue(item, "enclosure", "url");

  if (fromMedia) {
    return fromMedia;
  }

  const description = tagValue(item, "description");
  const imageMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);

  return imageMatch ? decodeXml(imageMatch[1]).trim() : "";
}

function cleanImageUrl(value: string) {
  if (!/^https?:\/\//i.test(value)) {
    return "";
  }

  return value;
}

function imageHintFor(title: string, source: string): NewsImageHint {
  const text = `${title} ${source}`.toLowerCase();

  if (/silver|xag|999/.test(text)) {
    return "silver-coins";
  }

  if (/chart|prediction|forecast|outlook|trend|rises|falls|volatility|market|mcx/.test(text)) {
    return "market-chart";
  }

  if (/jewel|jewellery|jewelry|ornament|retail|buyer|buying|wedding/.test(text)) {
    return "jewelry";
  }

  if (/delhi|mumbai|kolkata|chennai|bengaluru|bangalore|hyderabad|city|cities|maharashtra|india/.test(text)) {
    return "city-rates";
  }

  if (/bullion|bar|bars|reserve|spot/.test(text)) {
    return "bullion";
  }

  return "gold-bars";
}

export const revalidate = 600;
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = getCountry(searchParams.get("country") || "IN");
  const metal = searchParams.get("metal") as NewsMetal | null;
  const metalQuery =
    metal === "platinum"
      ? "platinum price OR platinum jewellery OR platinum market"
      : metal === "copper"
        ? "copper price OR copper market OR industrial metals"
        : metal === "silver"
          ? "silver price OR silver rate OR silver bullion"
          : metal === "gold"
            ? "gold price OR gold rate OR bullion"
            : "gold silver platinum copper price OR bullion";
  const query = encodeURIComponent(`${metalQuery} ${country.name}`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en&gl=${country.code}&ceid=${country.code}:en`;

  try {
    const response = await fetch(url, {
      headers: { accept: "application/rss+xml,text/xml" },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      throw new Error(`News feed responded with ${response.status}`);
    }

    const xml = await response.text();
    const items: NewsItem[] = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
      .slice(0, 8)
      .map((match) => {
        const body = match[1];
        const source = body.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? "Google News";

        const title = tagValue(body, "title");
        const cleanSource = decodeXml(source).trim();

        return {
          title,
          link: tagValue(body, "link"),
          source: cleanSource,
          publishedAt: tagValue(body, "pubDate"),
          imageUrl: cleanImageUrl(extractImageUrl(body)),
          imageHint: imageHintFor(title, cleanSource),
        };
      })
      .filter((item) => {
        const text = `${item.title} ${item.source}`;
        if (metal === "platinum") return /platinum|precious metal|jewellery/i.test(text);
        if (metal === "copper") return /copper|industrial metal|commodity|base metal/i.test(text);
        if (metal === "silver") return /silver|bullion|precious metal|jewellery/i.test(text);
        if (metal === "gold") return /gold|bullion|precious metal|jewellery/i.test(text);
        return /gold|silver|platinum|copper|bullion|precious metal|jewellery|commodity/i.test(text);
      });

    return NextResponse.json(
      {
        country: country.name,
        source: "Google News RSS",
        items,
      },
      { headers: CACHE_HEADERS },
    );
  } catch {
    return NextResponse.json(
      {
        error: "News feed is temporarily unavailable.",
        items: [],
      },
      { status: 503 },
    );
  }
}
