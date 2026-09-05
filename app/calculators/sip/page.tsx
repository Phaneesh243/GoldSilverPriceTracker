import type { Metadata } from "next";
import CalculatorPage from "../../_components/CalculatorPage";
import FinancePlatform from "../../_components/FinancePlatform";

export const metadata: Metadata = { title: "SIP Calculator", description: "Estimate SIP investment value, total contributions and projected gains.", alternates: { canonical: "/calculators/sip" } };
export default function Page() { return <FinancePlatform screen="calculators"><CalculatorPage kind="sip" /></FinancePlatform>; }
