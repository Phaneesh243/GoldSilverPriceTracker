import type { Metadata } from "next";
import InfoPage from "../_components/InfoPage";
import InvestmentReturnClient from "../_components/InvestmentReturnClient";

export const metadata: Metadata = {
  title: "Metal Investment Return Calculator",
  description: "Estimate gold, silver, platinum and copper investment profit or loss using current metal prices and manual buy price input.",
  alternates: { canonical: "/investment-return-calculator" },
};

export default function Page() {
  return (
    <InfoPage title="Investment Return Calculator" description="Estimate how much your metal investment could be worth today. Supports gold, silver, platinum and copper.">
      <InvestmentReturnClient />
    </InfoPage>
  );
}
