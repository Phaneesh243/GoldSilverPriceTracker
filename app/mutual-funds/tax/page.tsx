import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import MutualFundsModule from "../../_components/MutualFundsModule";
export const metadata: Metadata = { title: "Mutual Fund Tax Calculator and Guide India", description: "Understand mutual-fund tax inputs and estimate illustrative capital-gains tax scenarios.", alternates: { canonical: "/mutual-funds/tax" } };
export default function MutualFundsTaxPage() { return <FinancePlatform screen="mutual-funds"><MutualFundsModule view="tax" /></FinancePlatform>; }
