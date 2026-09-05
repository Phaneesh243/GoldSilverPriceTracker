import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import BondLandingModule from "../_components/BondLandingModule";

export const metadata: Metadata = { title: "Bonds Guide, Yields and Comparison India", description: "Explore government, treasury, corporate, tax-free and green bonds in India with yield, maturity, rating, risk and calculator tools.", alternates: { canonical: "/bonds" } };

export default function BondsPage() {
  return <FinancePlatform screen="bonds"><BondLandingModule /></FinancePlatform>;
}
