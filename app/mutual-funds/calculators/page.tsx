import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import MutualFundsModule from "../../_components/MutualFundsModule";
export const metadata: Metadata = { title: "SIP, XIRR, SWP and Mutual Fund Calculators", description: "Calculate SIP, lump-sum, step-up SIP, XIRR, SWP, goal and expense-ratio scenarios for mutual funds.", alternates: { canonical: "/mutual-funds/calculators" } };
export default function MutualFundsCalculatorsPage() { return <FinancePlatform screen="mutual-funds"><MutualFundsModule view="calculators" /></FinancePlatform>; }
