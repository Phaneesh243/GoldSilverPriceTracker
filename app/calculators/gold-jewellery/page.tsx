import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "Gold Jewellery Calculator", description: "Estimate gold jewellery value with purity, weight, making charges, wastage, GST and discount.", alternates: { canonical: "/calculators/gold-jewellery" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="gold-jewellery" /></FinancePlatform>; }
