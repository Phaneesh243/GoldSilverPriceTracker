import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "EMI Calculator", description: "Estimate monthly EMI, total loan payment and total interest from principal, rate and tenure.", alternates: { canonical: "/calculators/emi" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="emi" /></FinancePlatform>; }
