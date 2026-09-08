import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import MetalsLandingPage from "../_components/MetalsLandingPage";

export const metadata: Metadata = {
  title: "Metal Prices Today in India",
  description: "Explore metal reference prices, manual jewellery calculators, buying guides and transparent data availability for India.",
  alternates: { canonical: "/metals" },
};

export const revalidate = 60;

export default function MetalsPage() {
  return (
    <FinancePlatform screen="metals" customHeading={{ title: "Metals, made understandable.", subtitle: "Gold and silver references, practical calculators and buying guides for India." }}>
      <MetalsLandingPage />
    </FinancePlatform>
  );
}
