import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "Metal Investment Return Calculator", description: "Estimate current value, profit or loss and return percentage for gold, silver, platinum or copper.", alternates: { canonical: "/calculators/investment-return" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="investment-return" /></FinancePlatform>; }
