import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Indian Stocks Below ₹100", description: "Explore Indian stock reference profiles below ₹100 with valuation, liquidity and risk warnings.", alternates: { canonical: "/stocks/under-100" } };
export default function StocksUnderHundredPage() { return <FinancePlatform screen="stocks"><StocksModule view="priceBand" band={100} /></FinancePlatform>; }
