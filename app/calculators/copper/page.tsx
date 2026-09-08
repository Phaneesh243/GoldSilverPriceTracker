import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "Copper Calculator", description: "Calculate from your own metal quotation with transparent formulas and no paid data requirement.", alternates: { canonical: "/calculators/copper" } };
export default function Page() { return <FinancePlatform screen="calculators" customHeading={{ title: metadata.title as string, subtitle: "Manual estimates with explicit inputs, charges and limitations." }}><CalculatorPage kind="copper" /></FinancePlatform>; }
