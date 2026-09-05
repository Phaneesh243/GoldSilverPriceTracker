import FinancePlatform from "../_components/FinancePlatform";
import type { Metadata } from "next";
import CurrencyDashboard from "../_components/CurrencyDashboard";

export const metadata: Metadata = {
  title: "Currency Exchange Rates Today",
  description: "Track major currency pairs, INR exchange rates, historical FX movement and reference conversions.",
  alternates: { canonical: "/currencies" },
};

export default function CurrenciesPage() {
  return <FinancePlatform screen="currencies"><CurrencyDashboard /></FinancePlatform>;
}
