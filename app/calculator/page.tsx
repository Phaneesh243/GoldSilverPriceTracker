import type { Metadata } from "next";
import CalculatorClient from "../_components/CalculatorClient";
import InfoPage from "../_components/InfoPage";

export const metadata: Metadata = {
  title: "Gold and Silver Calculator",
  description: "Estimate gold and silver value with purity, weight, making charges and GST.",
  alternates: { canonical: "/calculator" },
};

export default function Page() {
  return (
    <InfoPage title="Gold & Silver Calculator" description="Estimate the value of your gold or silver with weight, purity, making charges and GST.">
      <CalculatorClient />
    </InfoPage>
  );
}
