import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Indian Stocks Below ₹10", description: "Explore Indian stock reference profiles below ₹10 with valuation, liquidity and risk warnings.", alternates: { canonical: "/stocks/under-10" } };
export default function StocksUnderTenPage() { return <FinancePlatform screen="stocks"><StocksModule view="priceBand" band={10} /></FinancePlatform>; }
