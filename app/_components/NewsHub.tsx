import Link from "next/link";
import AdSlot from "./AdSlot";
import Breadcrumbs from "./Breadcrumbs";
import NewsFeedClient from "./NewsFeedClient";
import { getNewsFeed, type NewsCategory, type NewsMetal } from "../../lib/news";

export default async function NewsHub({
  title = "Market news",
  description = "Independent market headlines, metal updates and investor context from publishers around the world.",
  metal,
  category,
}: {
  title?: string;
  description?: string;
  metal?: NewsMetal;
  category?: NewsCategory;
}) {
  let feed = { items: [] as Awaited<ReturnType<typeof getNewsFeed>>["items"], country: "India", countryCode: "IN", source: "Google News RSS", fetchedAt: new Date().toISOString() };
  try {
    feed = await getNewsFeed({ countryCode: "IN", metal, category });
  } catch {
    // The page remains useful when an upstream feed is temporarily unavailable.
  }

  return (
    <div className="news-public-content">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "News", href: "/news" }, ...(title === "Market news" ? [] : [{ label: title }])]} />
      <section className="news-hub-intro glass-panel">
        <div><span className="finance-eyebrow">{category || (metal ? `${metal} news` : "Latest insights")}</span><h2>{title}</h2><p>{description}</p></div>
        <div className="news-hub-links"><Link href="/news/saved">Saved stories</Link><Link href="/news/preferences">Manage preferences</Link></div>
      </section>
      <AdSlot id="news-top" />
      <section className="glass-panel news-feed-panel">
        <div className="panel-head"><div><span className="finance-eyebrow">{feed.source}</span><h2>Fresh market updates</h2></div><small className="news-refresh-note">Updated {new Date(feed.fetchedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></div>
        <NewsFeedClient initialItems={feed.items} metal={metal} category={category} />
      </section>
      <AdSlot id="news-bottom" />
    </div>
  );
}
