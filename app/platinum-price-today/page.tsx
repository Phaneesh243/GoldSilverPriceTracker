import type { Metadata } from "next";
import MetalDetailPage from "../_components/MetalDetailPage";

export const metadata: Metadata = {
  title: "Platinum Price Today in India",
  description: "Metal reference availability, source timestamps, manual calculators and buying information. Not a local retail quotation.",
  alternates: { canonical: "/platinum-price-today" },
};

export const revalidate = 300;

export default function Page() {
  return <MetalDetailPage metalKey="platinum" />;
}
