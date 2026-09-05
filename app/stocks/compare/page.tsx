import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Compare Indian Stocks", description: "Compare Indian stocks by price, PE, PB, ROE, ROCE, growth, debt and dividends.", alternates: { canonical: "/stocks/compare" } };
export default function StocksComparePage() { return <FinancePlatform screen="stocks"><StocksModule view="compare" /></FinancePlatform>; }
