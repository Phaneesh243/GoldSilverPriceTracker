import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "Tax Estimator", description: "Preview tax, surcharge and after-tax value using transparent percentage inputs.", alternates: { canonical: "/calculators/tax" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="tax" /></FinancePlatform>; }
