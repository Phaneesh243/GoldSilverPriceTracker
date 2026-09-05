import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import InsuranceModule from "../../_components/InsuranceModule";

export const metadata: Metadata = { title: "Popular Insurance Providers in India", description: "Explore popular life, health, general insurance providers and insurance intermediaries in India with source-dated reference information.", alternates: { canonical: "/insurance/providers" } };

export default function InsuranceProvidersPage() {
  return <FinancePlatform screen="insurance"><InsuranceModule view="providers" /></FinancePlatform>;
}
