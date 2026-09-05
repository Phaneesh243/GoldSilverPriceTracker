import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Explore Indian Stocks by Sector and Valuation", description: "Explore Indian stocks by sector, price, PE, ROE, debt, growth and market capitalisation.", alternates: { canonical: "/stocks/explore" } };
export default function StocksExplorePage() { return <FinancePlatform screen="stocks"><StocksModule view="explore" /></FinancePlatform>; }
