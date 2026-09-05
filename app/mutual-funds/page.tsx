import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import MutualFundLivePanel from "../_components/MutualFundLivePanel";
import MutualFundLandingModule from "../_components/MutualFundLandingModule";

export const metadata: Metadata = { title: "Mutual Funds Guide, SIP and Fund Comparison India", description: "Explore Indian mutual funds by category, returns, risk, cost, portfolio, SIP calculators and investor education.", alternates: { canonical: "/mutual-funds" } };

export default function MutualFundsPage() {
  return <FinancePlatform screen="mutual-funds"><MutualFundLivePanel /><MutualFundLandingModule /></FinancePlatform>;
}
