import type { Metadata } from "next";
import InfoPage from "../_components/InfoPage";

export const metadata: Metadata = {
  title: "Contact GoldSilverPrices",
  description: "Contact GoldSilverPrices for questions about gold rates, silver rates, data sources, privacy, and website feedback.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <InfoPage title="Contact GoldSilverPrices" description="Have a question about rates, data sources or the website?" />;
}
