import type { Metadata } from "next";
import MetalDetailPage from "../_components/MetalDetailPage";

export const metadata: Metadata = {
  title: "Gold Price Today in India",
  description: "Live gold price today in India with 24K, 22K, 18K rates, last 10 days trend, news, calculator and price alerts.",
  alternates: { canonical: "/gold-price-today" },
};

export const revalidate = 30;

export default function Page() {
  return <MetalDetailPage metalKey="gold" />;
}
