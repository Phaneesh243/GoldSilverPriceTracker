import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import PortfolioManager from "../../_components/PortfolioManager";
export const metadata: Metadata = { title: "Crypto Portfolio Tracker and P&L India", description: "Track crypto holdings, allocation, portfolio returns, cost records and security checklists.", alternates: { canonical: "/crypto/portfolio" } };
export default function CryptoPortfolioPage() { return <FinancePlatform screen="crypto"><PortfolioManager /></FinancePlatform>; }
