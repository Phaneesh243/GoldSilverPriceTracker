import { getCountry } from "./country-data";
import { redis } from "./redis";

export type NewsMetal = "gold" | "silver" | "platinum" | "copper";
export type NewsCategory = "metals" | "markets" | "investing" | "analysis" | "stocks" | "crypto" | "funds" | "insurance" | "bonds" | "currencies";
export type NewsImageHint = "gold-bars" | "silver-coins" | "market-chart" | "jewelry" | "city-rates" | "bullion";

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  link: string;
  source: string;
  publishedAt: string;
  fetchedAt: string;
  imageUrl: string;
  imageHint: NewsImageHint;
  category: NewsCategory;
  metals: NewsMetal[];
};

export type NewsFeed = {
  country: string;
  countryCode: string;
  source: string;
  fetchedAt: string;
  items: NewsItem[];
};

function decodeXml(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function tagValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

function attrValue(item: string, tag: string, attr: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

function stripHtml(value: string) {
  return decodeXml(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function imageUrlFor(item: string) {
  const media = attrValue(item, "media:content", "url") || attrValue(item, "media:thumbnail", "url") || attrValue(item, "enclosure", "url");
  if (/^https?:\/\//i.test(media)) return media;
  const description = tagValue(item, "description");
  const image = description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || "";
  return /^https?:\/\//i.test(image) ? decodeXml(image) : "";
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "market-update";
}

function imageHintFor(text: string): NewsImageHint {
  if (/silver|xag|999/.test(text)) return "silver-coins";
  if (/jewel|jewellery|jewelry|ornament|retail|buyer|wedding/.test(text)) return "jewelry";
  if (/delhi|mumbai|kolkata|chennai|bengaluru|bangalore|hyderabad|city|india/.test(text)) return "city-rates";
  if (/bullion|bar|bars|reserve|spot/.test(text)) return "bullion";
  if (/chart|prediction|forecast|outlook|trend|rises|falls|volatility|market|mcx|commodity/.test(text)) return "market-chart";
  return "gold-bars";
}

function metalsFor(text: string) {
  const values: NewsMetal[] = [];
  if (/gold|bullion|jewellery|jewelry|precious metal/.test(text)) values.push("gold");
  if (/silver/.test(text)) values.push("silver");
  if (/platinum/.test(text)) values.push("platinum");
  if (/copper|industrial metal|base metal/.test(text)) values.push("copper");
  return [...new Set(values)];
}

function categoryFor(text: string, metals: NewsMetal[]): NewsCategory {
  if (/bitcoin|ethereum|crypto|blockchain|digital asset|web3/.test(text)) return "crypto";
  if (/stock|share price|equity|nifty|sensex|nasdaq|dow jones|ipo|earnings/.test(text)) return "stocks";
  if (/mutual fund|sip|nav|asset management|amc|etf|portfolio/.test(text)) return "funds";
  if (/insurance|insurer|premium|claim settlement|life cover|health cover/.test(text)) return "insurance";
  if (/bond|treasury|g-sec|yield|fixed income|debenture/.test(text)) return "bonds";
  if (/currency|forex|rupee|inr|dollar|euro|yen|pound/.test(text)) return "currencies";
  if (/analysis|outlook|forecast|prediction|strategy|expert/.test(text)) return "analysis";
  if (/investment|investor|etf|fund|portfolio|buy|sell|return/.test(text)) return "investing";
  if (metals.length || /bullion|commodity|jewellery|jewelry/.test(text)) return "metals";
  return "markets";
}

function queryFor(metal?: NewsMetal, category?: NewsCategory) {
  if (metal === "gold") return "gold price OR gold rate OR bullion OR gold jewellery";
  if (metal === "silver") return "silver price OR silver rate OR silver bullion";
  if (metal === "platinum") return "platinum price OR platinum jewellery OR platinum market";
  if (metal === "copper") return "copper price OR copper market OR industrial metals";
  if (category === "stocks") return "India stocks OR NSE OR BSE OR Nifty OR Sensex OR company earnings";
  if (category === "crypto") return "India crypto OR Bitcoin OR Ethereum OR digital assets regulation";
  if (category === "funds") return "India mutual funds OR SIP OR ETF OR asset management OR NAV";
  if (category === "insurance") return "India insurance OR IRDAI OR health insurance OR life insurance OR insurance claims";
  if (category === "bonds") return "India bonds OR government securities OR RBI yield OR treasury OR fixed income";
  if (category === "currencies") return "India rupee OR INR OR forex OR RBI currency OR dollar rupee";
  if (category === "investing") return "commodities investment OR gold investment OR market investor";
  if (category === "analysis") return "gold outlook OR silver outlook OR commodity market analysis";
  if (category === "markets") return "financial markets OR commodities OR currency market India";
  return "India finance OR stocks OR crypto OR mutual funds OR insurance OR bonds OR currencies OR commodities OR gold silver price";
}

function cacheKey(countryCode: string, metal?: NewsMetal, category?: NewsCategory) {
  return `gsp:v2:news:${countryCode.toLowerCase()}:${metal || "all"}:${category || "all"}`;
}

const NEWS_MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;

function isRecent(publishedAt: string, now = Date.now()) {
  const timestamp = Date.parse(publishedAt);
  if (!Number.isFinite(timestamp)) return false;
  return timestamp <= now + 2 * 24 * 60 * 60 * 1000 && now - timestamp <= NEWS_MAX_AGE_MS;
}

export async function getNewsFeed({ countryCode = "IN", metal, category }: { countryCode?: string; metal?: NewsMetal; category?: NewsCategory } = {}): Promise<NewsFeed> {
  const country = getCountry(countryCode);
  const key = cacheKey(country.code, metal, category);
  if (redis) {
    const cached = await redis.get<NewsFeed>(key);
    if (cached?.items) return cached;
  }

  const query = encodeURIComponent(`${queryFor(metal, category)} ${country.name} when:30d`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en&gl=${country.code}&ceid=${country.code}:en`;
  const response = await fetch(url, { headers: { accept: "application/rss+xml,text/xml" }, signal: AbortSignal.timeout(10_000), next: { revalidate: 600 } });
  if (!response.ok) throw new Error(`News feed responded with ${response.status}`);
  const xml = await response.text();
  const fetchedAt = new Date().toISOString();
  const seen = new Set<string>();
  const items: NewsItem[] = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, 30)
    .map((match) => {
      const body = match[1];
      const title = tagValue(body, "title");
      const source = tagValue(body, "source") || "Google News";
      const link = tagValue(body, "link");
      const text = `${title} ${source}`.toLowerCase();
      const articleMetals = metalsFor(text);
      return {
        id: `${slugify(title)}-${slugify(source)}`,
        slug: slugify(title),
        title,
        summary: stripHtml(tagValue(body, "description")).slice(0, 280),
        link,
        source,
        publishedAt: tagValue(body, "pubDate"),
        fetchedAt,
        imageUrl: imageUrlFor(body),
        imageHint: imageHintFor(text),
        category: categoryFor(text, articleMetals),
        metals: articleMetals,
      };
    })
    .filter((item) => {
      if (!item.title || !item.link || seen.has(item.id) || !isRecent(item.publishedAt)) return false;
      seen.add(item.id);
      if (metal && !item.metals.includes(metal)) return false;
      if (category && item.category !== category) return false;
      return true;
    });

  const feed = { country: country.name, countryCode: country.code, source: "Google News RSS", fetchedAt, items };
  if (redis) await redis.set(key, JSON.stringify(feed), { ex: 600 });
  return feed;
}

export async function getNewsArticle(slug: string, countryCode = "IN") {
  const feeds = await Promise.all([
    getNewsFeed({ countryCode }),
    getNewsFeed({ countryCode, category: "metals" }),
    getNewsFeed({ countryCode, category: "markets" }),
    getNewsFeed({ countryCode, category: "investing" }),
    getNewsFeed({ countryCode, category: "analysis" }),
    getNewsFeed({ countryCode, category: "stocks" }),
    getNewsFeed({ countryCode, category: "crypto" }),
    getNewsFeed({ countryCode, category: "funds" }),
    getNewsFeed({ countryCode, category: "insurance" }),
    getNewsFeed({ countryCode, category: "bonds" }),
    getNewsFeed({ countryCode, category: "currencies" }),
    getNewsFeed({ countryCode, metal: "gold" }),
    getNewsFeed({ countryCode, metal: "silver" }),
    getNewsFeed({ countryCode, metal: "platinum" }),
    getNewsFeed({ countryCode, metal: "copper" }),
  ]);
  const articles = feeds.flatMap((feed) => feed.items);
  return articles.find((item) => item.slug === slug || item.id === slug) || null;
}
