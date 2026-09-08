import type { Metadata } from "next";
import MetalDetailPage from "../_components/MetalDetailPage";

export const metadata: Metadata = {
  title: "Copper Price Today in India",
  description: "Metal reference availability, source timestamps, manual calculators and buying information. Not a local retail quotation.",
  alternates: { canonical: "/copper-price-today" },
};

export const revalidate = 300;

export default function Page() {
  return <MetalDetailPage metalKey="copper" />;
}
