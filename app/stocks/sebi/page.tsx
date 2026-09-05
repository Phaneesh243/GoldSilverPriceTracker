import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "SEBI Investor Protection and Stock Market Safety", description: "Learn SEBI investor protections, broker verification, grievance mechanisms and stock-market scam warnings.", alternates: { canonical: "/stocks/sebi" } };
export default function StocksSebiPage() { return <FinancePlatform screen="stocks"><StocksModule view="sebi" /></FinancePlatform>; }
