import type { Metadata } from "next";
import MetalDetailPage from "../_components/MetalDetailPage";

export const metadata: Metadata = {
  title: "Silver Price Today in India",
  description: "Silver reference in INR per gram and kilogram, source timestamps, fineness guidance, calculators and silver news. Not a dealer quotation.",
  alternates: { canonical: "/silver-price-today" },
};

export const revalidate = 30;

export default function Page() {
  return <MetalDetailPage metalKey="silver" />;
}
