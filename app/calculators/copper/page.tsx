import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "Copper Calculator", description: "Estimate copper value by kilogram or tonne using the latest available reference price.", alternates: { canonical: "/calculators/copper" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="copper" /></FinancePlatform>; }
