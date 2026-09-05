import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Indian Stock Results and Earnings Calendar", description: "Track Indian company results, earnings calendars, board meetings and investor presentations.", alternates: { canonical: "/stocks/results" } };
export default function StocksResultsPage() { return <FinancePlatform screen="stocks"><StocksModule view="results" /></FinancePlatform>; }
