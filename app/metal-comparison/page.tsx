import type { Metadata } from "next";
import InfoPage from "../_components/InfoPage";
import MetalComparisonClient from "../_components/MetalComparisonClient";

export const metadata: Metadata = {
  title: "Metal Comparison - Gold vs Silver vs Platinum vs Copper",
  description: "Compare gold, silver, platinum and copper prices, units, market use and investor notes in one dashboard.",
  alternates: { canonical: "/metal-comparison" },
};

export default function Page() {
  return (
    <InfoPage title="Metal Comparison" description="Compare precious and industrial metals before you invest, buy jewellery, or track commodity movement.">
      <MetalComparisonClient />
    </InfoPage>
  );
}
