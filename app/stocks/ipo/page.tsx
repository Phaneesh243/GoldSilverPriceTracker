import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
export const metadata: Metadata = { title: "India IPO Calendar and Research", description: "Review Indian IPO dates, price bands, lot sizes, documents, peers and risk factors.", alternates: { canonical: "/stocks/ipo" } };
export default function StocksIpoPage() { return <FinancePlatform screen="stocks"><StocksModule view="ipo" /></FinancePlatform>; }
