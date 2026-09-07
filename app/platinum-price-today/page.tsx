import type { Metadata } from "next";
import MetalDetailPage from "../_components/MetalDetailPage";

export const metadata: Metadata = {
  title: "Platinum Price Today in India",
  description: "Live platinum price today in India with investor notes, market news, market updates and return calculator.",
  alternates: { canonical: "/platinum-price-today" },
};

export const revalidate = 300;

export default function Page() {
  return <MetalDetailPage metalKey="platinum" />;
}
