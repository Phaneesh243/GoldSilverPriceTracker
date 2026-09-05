import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import AdSlot from "./AdSlot";
import Breadcrumbs from "./Breadcrumbs";
import { getNewsArticle, type NewsItem } from "../../lib/news";

const images: Record<NewsItem["imageHint"], string> = {
  "gold-bars": "/news/gold-bars-01.jpg",
  "silver-coins": "/news/silver-coins-03.jpg",
  "market-chart": "/news/market-chart-05.jpg",
  jewelry: "/news/gold-jewellery-04.jpg",
  "city-rates": "/news/gold-rings-08.jpg",
  bullion: "/news/gold-bullion-02.jpg",
};

function dateFor(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Latest" : date.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });
}

export default async function NewsArticlePage({ slug }: { slug: string }) {
  const article = await getNewsArticle(slug).catch(() => null);
  if (!article) return <div className="news-empty glass-panel"><h2>This story is no longer available</h2><p>Return to the news hub for the latest market updates.</p><Link className="primary-button" href="/news">Browse news</Link></div>;

  const jsonLd = { "@context": "https://schema.org", "@type": "NewsArticle", headline: article.title, description: article.summary, datePublished: article.publishedAt, dateModified: article.publishedAt, image: [`https://goldsilverprices.in${images[article.imageHint]}`], mainEntityOfPage: `https://goldsilverprices.in/news/article/${article.slug}`, publisher: { "@type": "Organization", name: article.source }, isBasedOn: article.link };
  return (
    <div className="news-public-content news-article-layout">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "News", href: "/news" }, { label: article.title }]} />
      <article className="glass-panel news-article-card">
        <div className="news-article-top"><span className="finance-eyebrow">{article.category} {article.metals.length ? `· ${article.metals.join(" · ")}` : ""}</span><time dateTime={article.publishedAt}>{dateFor(article.publishedAt)}</time></div>
        <h2>{article.title}</h2>
        <p className="news-article-summary">{article.summary || "The latest market development from the original publisher."}</p>
        <Image className="news-article-image" src={images[article.imageHint]} alt="" width={1280} height={720} priority />
        <div className="news-article-copy"><p>This page provides a concise market summary and attribution. It does not reproduce the original publisher’s article. Read the source for the complete report, charts and any updates.</p><a className="primary-button" href={article.link} target="_blank" rel="noopener noreferrer">Read the original story <ExternalLink size={16} /></a></div>
        <div className="news-related-links"><span className="finance-eyebrow">Continue exploring</span><Link href="/metals">Live metal prices</Link><Link href="/historical-prices">Historical charts</Link><Link href="/calculators">Metal calculators</Link></div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AdSlot id="news-article" />
    </div>
  );
}
