import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import CalculatorsHub from "../_components/CalculatorsHub";

export const metadata: Metadata = {
  title: "Financial Calculators",
  description: "Gold, silver, investment, conversion and finance calculators using live market references where available.",
  alternates: { canonical: "/calculators" },
};

export default function CalculatorsPage() {
  return <FinancePlatform screen="calculators"><CalculatorsHub /></FinancePlatform>;
}
