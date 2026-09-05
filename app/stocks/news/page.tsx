import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "Latest Indian Stock News and Market Research", description: "Follow Indian stock market, company, IPO, results, SEBI and exchange research links.", alternates: { canonical: "/stocks/news" } };
export default function StocksNewsPage() { return <FinancePlatform screen="stocks"><StocksModule view="news" /></FinancePlatform>; }
