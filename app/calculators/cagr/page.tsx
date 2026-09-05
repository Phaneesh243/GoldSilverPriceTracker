import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "CAGR Calculator", description: "Calculate annualized compound growth between an initial and final value.", alternates: { canonical: "/calculators/cagr" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="cagr" /></FinancePlatform>; }
