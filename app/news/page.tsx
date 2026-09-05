import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import NewsHub from "../_components/NewsHub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Market News | Gold, Silver and Finance Updates",
  description: "Read the latest gold, silver, commodity, market and investing news with source attribution and responsive market filters.",
  alternates: { canonical: "/news" },
};

export default function NewsPage() {
  return <FinancePlatform screen="news"><NewsHub /></FinancePlatform>;
}
