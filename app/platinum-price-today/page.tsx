import type { Metadata } from "next";
import MetalDetailPage from "../_components/MetalDetailPage";

export const metadata: Metadata = {
  title: "Platinum Price Today in India",
  description: "Platinum reference in INR per gram, source timestamps, Pt950 limitations, purchase tools and platinum news. Not a jewellery quotation.",
  alternates: { canonical: "/platinum-price-today" },
};

export const revalidate = 300;

export default function Page() {
  return <MetalDetailPage metalKey="platinum" />;
}
