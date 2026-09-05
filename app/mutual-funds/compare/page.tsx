import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import MutualFundsModule from "../../_components/MutualFundsModule";
export const metadata: Metadata = { title: "Compare Mutual Funds in India", description: "Compare mutual-fund returns, riskometer, expense ratio, AUM, minimum SIP and exit load.", alternates: { canonical: "/mutual-funds/compare" } };
export default function MutualFundsComparePage() { return <FinancePlatform screen="mutual-funds"><MutualFundsModule view="compare" /></FinancePlatform>; }
