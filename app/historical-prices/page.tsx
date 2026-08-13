import type { Metadata } from "next";
import HistoricalPricesClient from "../_components/HistoricalPricesClient";
import InfoPage from "../_components/InfoPage";

export const metadata: Metadata = {
  title: "Historical Gold and Silver Prices",
  description: "Explore historical gold and silver price trends in India by range, metal, city, and purity.",
  alternates: { canonical: "/historical-prices" },
};

export default function Page() {
  return (
    <InfoPage title="Historical Prices" description="Explore gold and silver price movement over 1 day, 7 days, 1 month, 6 months and 1 year.">
      <HistoricalPricesClient />
    </InfoPage>
  );
}
