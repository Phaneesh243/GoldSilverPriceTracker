import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Indian Stock Corporate Actions and Filings", description: "Review Indian stock dividends, bonus issues, splits, rights issues, buybacks and exchange filings.", alternates: { canonical: "/stocks/corporate-actions" } };
export default function StocksActionsPage() { return <FinancePlatform screen="stocks"><StocksModule view="actions" /></FinancePlatform>; }
