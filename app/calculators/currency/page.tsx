import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "Currency Converter", description: "Convert an amount using a visible reference exchange rate and understand the result assumptions.", alternates: { canonical: "/calculators/currency" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="currency" /></FinancePlatform>; }
