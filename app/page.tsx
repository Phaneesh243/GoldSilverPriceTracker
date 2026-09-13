import type { Metadata } from "next";
import FinancePlatform from "./_components/FinancePlatform";
import LiveDashboardModule from "./_components/LiveDashboardModule";

export const metadata: Metadata = {
  title: "India Metals Dashboard",
  description: "Follow gold, silver, platinum and copper prices in India, with buying guides, news, calculators and your personal watchlist.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <FinancePlatform screen="home">
      <LiveDashboardModule />
    </FinancePlatform>
  );
}
