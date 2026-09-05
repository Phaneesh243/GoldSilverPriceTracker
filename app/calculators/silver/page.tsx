import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = {
  title: "Silver Calculator",
  description: "Estimate silver value from the latest India price, weight and premium percentage.",
  alternates: { canonical: "/calculators/silver" },
};

export default function Page() {
  return <FinancePlatform screen="calculators"><CalculatorPage kind="silver" /></FinancePlatform>;
}
