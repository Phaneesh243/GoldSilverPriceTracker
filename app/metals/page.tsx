import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import MetalsLandingPage from "../_components/MetalsLandingPage";

export const metadata: Metadata = {
  title: "Metal Prices Today in India",
  description: "Track live gold, silver, platinum and copper prices in India with charts, calculators, news and price alerts.",
  alternates: { canonical: "/metals" },
};

export const revalidate = 60;

export default function MetalsPage() {
  return (
    <FinancePlatform screen="metals">
      <MetalsLandingPage />
    </FinancePlatform>
  );
}
