import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Indian Stock Screener by PE, ROE and Growth", description: "Screen Indian stocks by PE, PB, ROE, ROCE, growth, debt, dividend yield and price bands.", alternates: { canonical: "/stocks/screener" } };
export default function StocksScreenerPage() { return <FinancePlatform screen="stocks"><StocksModule view="screener" /></FinancePlatform>; }
