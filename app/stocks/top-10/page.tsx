import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Top 10 Indian Stocks by PE, ROE and Dividend", description: "View transparent top-stock screens based on PE, ROE, dividend yield and profit growth.", alternates: { canonical: "/stocks/top-10" } };
export default function TopTenStocksPage() { return <FinancePlatform screen="stocks"><StocksModule view="top10" /></FinancePlatform>; }
