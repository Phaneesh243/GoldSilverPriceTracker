import type { Metadata } from "next";
import Last10DaysPage from "../_components/Last10DaysPage";

export const metadata: Metadata = {
  title: "Gold Price Last 10 Days in India",
  description: "Gold price last 10 days in India with daily close, change and trend table.",
  alternates: { canonical: "/gold-price-last-10-days" },
};

export const revalidate = 600;

export default function Page() {
  return <Last10DaysPage metalKey="gold" />;
}
