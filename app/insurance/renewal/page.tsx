import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import InsuranceModule from "../../_components/InsuranceModule";

export const metadata: Metadata = { title: "Insurance Renewal Guide India", description: "Review coverage, exclusions, premiums, continuity benefits and documents before renewing insurance in India.", alternates: { canonical: "/insurance/renewal" } };

export default function InsuranceRenewalPage() {
  return <FinancePlatform screen="insurance"><InsuranceModule view="renewal" /></FinancePlatform>;
}
