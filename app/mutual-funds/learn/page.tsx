import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import MutualFundsModule from "../../_components/MutualFundsModule";
export const metadata: Metadata = { title: "Mutual Funds Learning Centre India", description: "Learn about NAV, SIP, riskometer, expense ratio, direct plans, IDCW, taxes and mutual-fund risks.", alternates: { canonical: "/mutual-funds/learn" } };
export default function MutualFundsLearnPage() { return <FinancePlatform screen="mutual-funds"><MutualFundsModule view="learn" /></FinancePlatform>; }
