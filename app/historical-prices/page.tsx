import type { Metadata } from "next";
import Link from "next/link";
import MetalPageShell from "../_components/MetalPageShell";
import MetalPriceChart from "../_components/MetalPriceChart";

export const metadata: Metadata = {
  title: "Historical Gold and Silver Prices",
  description: "Historical reference coverage and source availability; no invented city prices or chart points.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/historical-prices" },
};

export default function Page() {
  return (
    <MetalPageShell title="Historical metal reference coverage" description="History is enabled only when valid observations and storage/display permissions are verified.">
      <MetalPriceChart metal="gold" color="#c9961a" />
      <p>No city quotation or retail purity is inferred from a spot-reference series. Read the <Link href="/metals/learn/methodology">data methodology</Link> or use the <Link href="/calculators/investment-return">manual return calculator</Link>.</p>
    </MetalPageShell>
  );
}
