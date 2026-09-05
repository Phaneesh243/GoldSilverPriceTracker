import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "Gold Purity Converter", description: "Convert gold weight and value between 24K, 22K and 18K purity references.", alternates: { canonical: "/calculators/purity-converter" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="purity-converter" /></FinancePlatform>; }
