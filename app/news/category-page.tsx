import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import NewsHub from "../_components/NewsHub";
import type { NewsCategory, NewsMetal } from "../../lib/news";

export const dynamic = "force-dynamic";

export default function NewsCategoryPage({ title, description, metal, category }: { title: string; description: string; metal?: NewsMetal; category?: NewsCategory }) {
  return <FinancePlatform screen="news"><NewsHub title={title} description={description} metal={metal} category={category} /></FinancePlatform>;
}

export function categoryMetadata(title: string, description: string, slug: string): Metadata {
  return { title: `${title} | GoldSilverPrices`, description, alternates: { canonical: `/news/${slug}` } };
}
