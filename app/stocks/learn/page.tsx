import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Indian Stock Market Learning Centre", description: "Learn about PE, dividends, demat accounts, brokers, corporate actions and SEBI investor safety.", alternates: { canonical: "/stocks/learn" } };
export default function StocksLearnPage() { return <FinancePlatform screen="stocks"><StocksModule view="sebi" /></FinancePlatform>; }
