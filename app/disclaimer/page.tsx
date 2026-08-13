import type { Metadata } from "next";
import InfoPage from "../_components/InfoPage";

export const metadata: Metadata = {
  title: "GoldSilverPrices Disclaimer",
  description: "Read the GoldSilverPrices disclaimer about indicative gold and silver rates, jeweller price variation, and investment advice.",
  alternates: { canonical: "/disclaimer" },
};

export default function Page() {
  return (
    <InfoPage title="Disclaimer" description="Important information about the use of GoldSilverPrices rates.">
      <h2>Informational use only</h2>
      <p>GoldSilverPrices does not provide investment, financial or tax advice. Prices are indicative and may not match the final price quoted by a jeweller.</p>
    </InfoPage>
  );
}
