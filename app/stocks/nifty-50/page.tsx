import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Nifty 50 Stocks and Constituents India", description: "Review Nifty 50 stock prices, sectors, PE, ROE, dividend yield and reference fundamentals.", alternates: { canonical: "/stocks/nifty-50" } };
export default function NiftyFiftyPage() { return <FinancePlatform screen="stocks"><StocksModule view="nifty" /></FinancePlatform>; }
