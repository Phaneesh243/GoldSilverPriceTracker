import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import PortfolioManager from "../../_components/PortfolioManager";
export const metadata: Metadata = { title: "Mutual Fund Portfolio Tracker and Analysis", description: "Track mutual-fund investment value, SIP contributions, allocation and portfolio health checks.", alternates: { canonical: "/mutual-funds/portfolio" } };
export default function MutualFundsPortfolioPage() { return <FinancePlatform screen="mutual-funds"><PortfolioManager /></FinancePlatform>; }
