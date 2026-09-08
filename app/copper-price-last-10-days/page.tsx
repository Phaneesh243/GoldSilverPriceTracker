import type { Metadata } from "next";
import Last10DaysPage from "../_components/Last10DaysPage";

export const metadata: Metadata = {
  title: "Copper Price Last 10 Days in India",
  description: "Historical coverage and source availability. Numeric history is disabled pending provider verification.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/copper-price-last-10-days" },
};

export const revalidate = 600;

export default function Page() {
  return <Last10DaysPage metalKey="copper" />;
}
