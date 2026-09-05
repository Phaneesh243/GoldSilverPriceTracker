import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "NSE, BSE and Indian Depository Guide", description: "Understand NSE, BSE, Sensex, Nifty, NSDL, CDSL, demat accounts and Indian exchange services.", alternates: { canonical: "/stocks/exchanges" } };
export default function StocksExchangesPage() { return <FinancePlatform screen="stocks"><StocksModule view="exchanges" /></FinancePlatform>; }
