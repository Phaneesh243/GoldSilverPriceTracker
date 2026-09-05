import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinancePlatform from "../../../_components/FinancePlatform";
import NewsArticlePage from "../../../_components/NewsArticlePage";
import { getNewsArticle } from "../../../../lib/news";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsArticle(slug).catch(() => null);
  if (!article) return { title: "News story unavailable | GoldSilverPrices" };
  return { title: `${article.title} | GoldSilverPrices`, description: article.summary, alternates: { canonical: `/news/article/${article.slug}` }, openGraph: { type: "article", title: article.title, description: article.summary, publishedTime: article.publishedAt } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getNewsArticle(slug).catch(() => null);
  if (!article) notFound();
  return <FinancePlatform screen="article"><NewsArticlePage slug={slug} /></FinancePlatform>;
}
