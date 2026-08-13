import type { Metadata } from "next";
import InfoPage from "../_components/InfoPage";

export const metadata: Metadata = {
  title: "About GoldSilverPrices",
  description: "Learn how GoldSilverPrices helps users compare indicative gold and silver rates across India.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <InfoPage title="About GoldSilverPrices" description="Clear, useful gold and silver price information for India." />;
}
