import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "Metal Weight Converter", description: "Convert grams, kilograms, tola, ounces, pounds and tonnes for metal calculations.", alternates: { canonical: "/calculators/weight-converter" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="weight-converter" /></FinancePlatform>; }
