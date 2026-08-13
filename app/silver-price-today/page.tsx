import type { Metadata } from "next";
import MetalDetailPage from "../_components/MetalDetailPage";

export const metadata: Metadata = {
  title: "Silver Price Today in India",
  description: "Live silver price today in India per gram, 10 grams and kilogram with last 10 days trend, news, calculator and alerts.",
  alternates: { canonical: "/silver-price-today" },
};

export const revalidate = 30;

export default function Page() {
  return <MetalDetailPage metalKey="silver" />;
}
