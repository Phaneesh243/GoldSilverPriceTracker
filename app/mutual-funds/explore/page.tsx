import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import MutualFundsModule from "../../_components/MutualFundsModule";
export const metadata: Metadata = { title: "Explore Mutual Funds by Returns, Risk and Cost", description: "Screen reference mutual funds in India by category, riskometer, returns, expense ratio and investment minimums.", alternates: { canonical: "/mutual-funds/explore" } };
export default function MutualFundsExplorePage() { return <FinancePlatform screen="mutual-funds"><MutualFundsModule view="explore" /></FinancePlatform>; }
