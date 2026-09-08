import type { Metadata } from "next";
import MetalPageShell from "../_components/MetalPageShell";
import MetalComparisonClient from "../_components/MetalComparisonClient";

export const metadata: Metadata = {
  title: "Metal Comparison - Gold vs Silver vs Platinum vs Copper",
  description: "Compare gold, silver, platinum and copper prices, units, market use and investor notes in one dashboard.",
  alternates: { canonical: "/metal-comparison" },
};

export default function Page() {
  return (
    <MetalPageShell title="Metal comparison" description="Compare reference availability, units and sources. A lower unit price is not an investment recommendation.">
      <MetalComparisonClient />
    </MetalPageShell>
  );
}
