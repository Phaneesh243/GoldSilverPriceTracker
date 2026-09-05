import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import InsuranceModule from "../../_components/InsuranceModule";

export const metadata: Metadata = { title: "Compare Insurance Policies India", description: "Compare insurance coverage, benefits, exclusions, waiting periods, deductibles and claims factors in India.", alternates: { canonical: "/insurance/compare" } };

export default function InsuranceComparePage() {
  return <FinancePlatform screen="insurance-compare"><InsuranceModule view="compare" /></FinancePlatform>;
}
