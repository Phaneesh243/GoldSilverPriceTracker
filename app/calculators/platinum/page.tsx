import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "Platinum Calculator", description: "Estimate platinum value by weight using the latest available reference price.", alternates: { canonical: "/calculators/platinum" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="platinum" /></FinancePlatform>; }
