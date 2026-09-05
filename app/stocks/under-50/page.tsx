import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Indian Stocks Below ₹50", description: "Explore Indian stock reference profiles below ₹50 with valuation, liquidity and risk warnings.", alternates: { canonical: "/stocks/under-50" } };
export default function StocksUnderFiftyPage() { return <FinancePlatform screen="stocks"><StocksModule view="priceBand" band={50} /></FinancePlatform>; }
