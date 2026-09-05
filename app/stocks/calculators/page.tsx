import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Stock Brokerage, PE and Risk Calculators India", description: "Calculate average price, PE valuation, position risk and illustrative stock trading charges.", alternates: { canonical: "/stocks/calculators" } };
export default function StocksCalculatorsPage() { return <FinancePlatform screen="stocks"><StocksModule view="calculators" /></FinancePlatform>; }
