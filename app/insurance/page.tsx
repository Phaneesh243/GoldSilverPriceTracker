import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import InsuranceLandingModule from "../_components/InsuranceLandingModule";

export const metadata: Metadata = { title: "Insurance Guide and Comparison India", description: "Understand health, term, life, car and other insurance benefits, disadvantages, providers, claims and comparison factors in India.", alternates: { canonical: "/insurance" } };

export default function InsurancePage() {
  return <FinancePlatform screen="insurance"><InsuranceLandingModule /></FinancePlatform>;
}
