import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import PortfolioManager from "../../_components/PortfolioManager";
export const metadata: Metadata = { title: "Indian Stock Portfolio Tracker and P&L", description: "Track Indian stock portfolio value, returns, dividend income, allocation and research checks.", alternates: { canonical: "/stocks/portfolio" } };
export default function StocksPortfolioPage() { return <FinancePlatform screen="stocks"><PortfolioManager /></FinancePlatform>; }
