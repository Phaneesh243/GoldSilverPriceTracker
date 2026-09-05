import { getNewsFeed } from "../../../lib/news";

export const runtime = "nodejs";
export const revalidate = 600;

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const feed = await getNewsFeed({ countryCode: "IN" }).catch(() => ({ items: [], fetchedAt: new Date().toISOString() }));
  const items = feed.items.slice(0, 30).map((item) => `<item><title>${escapeXml(item.title)}</title><link>${escapeXml(item.link)}</link><guid isPermaLink="false">${escapeXml(item.id)}</guid><description>${escapeXml(item.summary)}</description><pubDate>${escapeXml(item.publishedAt || feed.fetchedAt)}</pubDate><source url="https://news.google.com/">${escapeXml(item.source)}</source></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>GoldSilverPrices Market News</title><link>https://goldsilverprices.in/news</link><description>Latest source-attributed market, metals and investing news.</description><language>en-IN</language><lastBuildDate>${escapeXml(feed.fetchedAt)}</lastBuildDate>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" } });
}
