import type { Metadata } from "next";
import FinancePlatform from "./_components/FinancePlatform";
import LiveDashboardModule from "./_components/LiveDashboardModule";

export const metadata: Metadata = {
  title: "Indian Finance Dashboard",
  description: "Track Indian markets, metals, stocks, crypto, mutual funds, bonds, insurance, currencies, news and calculators in one dashboard.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <FinancePlatform screen="home">
      <LiveDashboardModule />
    </FinancePlatform>
  );
}
