import type { Metadata } from "next";
import MetalDetailPage from "../_components/MetalDetailPage";

export const metadata: Metadata = {
  title: "Gold Price Today in India",
  description: "Gold reference in INR per 10g and gram, source timestamps, purity guidance, purchase calculators and gold news. Not a local retail quotation.",
  alternates: { canonical: "/gold-price-today" },
};

export const revalidate = 30;

export default function Page() {
  return <MetalDetailPage metalKey="gold" />;
}
