import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Indian Stock Brokers and SEBI Verification", description: "Compare Indian broker service categories and verify registration, exchange membership and official disclosures.", alternates: { canonical: "/stocks/brokers" } };
export default function StocksBrokersPage() { return <FinancePlatform screen="stocks"><StocksModule view="brokers" /></FinancePlatform>; }
