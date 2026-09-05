import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import InsuranceModule from "../../_components/InsuranceModule";

export const metadata: Metadata = { title: "Insurance Cover Calculator India", description: "Estimate an indicative starting point for health insurance and term insurance cover in India.", alternates: { canonical: "/insurance/calculators" } };

export default function InsuranceCalculatorsPage() {
  return <FinancePlatform screen="insurance"><InsuranceModule view="calculator" /></FinancePlatform>;
}
