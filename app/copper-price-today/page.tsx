import type { Metadata } from "next";
import MetalDetailPage from "../_components/MetalDetailPage";

export const metadata: Metadata = {
  title: "Copper Price Today in India",
  description: "Live copper price today in India per kg with industrial metal notes, market news, alerts and comparison tools.",
  alternates: { canonical: "/copper-price-today" },
};

export const revalidate = 300;

export default function Page() {
  return <MetalDetailPage metalKey="copper" />;
}
