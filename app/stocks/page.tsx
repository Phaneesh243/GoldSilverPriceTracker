import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import StocksLivePanel from "../_components/StocksLivePanel";

export const metadata: Metadata = { title: "Indian Stock Market, NSE BSE and Nifty 50", description: "Research Indian stocks by NSE, BSE, Nifty 50, valuation, PE, ROE, dividends, news, brokers and corporate actions.", alternates: { canonical: "/stocks" } };

export default function StocksPage() {
  return <FinancePlatform screen="stocks"><StocksLivePanel /></FinancePlatform>;
}
