import type { Metadata } from "next";
import MetalDetailPage from "../_components/MetalDetailPage";

export const metadata: Metadata = {
  title: "Copper Price Today in India",
  description: "Copper benchmark conversion in INR per kg, disclosed HG unit convention, source timestamps, purchase tools and news. Not a retail or scrap quote.",
  alternates: { canonical: "/copper-price-today" },
};

export const revalidate = 300;

export default function Page() {
  return <MetalDetailPage metalKey="copper" />;
}
