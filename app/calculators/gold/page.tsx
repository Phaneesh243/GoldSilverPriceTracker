import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = {
  title: "Gold Calculator",
  description: "Estimate gold value from the latest India price, weight and making-charge percentage.",
  alternates: { canonical: "/calculators/gold" },
};

export default function Page() {
  return <FinancePlatform screen="calculators"><CalculatorPage kind="gold" /></FinancePlatform>;
}
