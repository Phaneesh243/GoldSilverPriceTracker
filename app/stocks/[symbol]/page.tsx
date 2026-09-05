import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
import { indianStocks } from "../../../lib/indian-stocks";
export function generateStaticParams() { return indianStocks.map((stock) => ({ symbol: stock.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> { const { symbol } = await params; const stock = indianStocks.find((item) => item.slug === symbol); return { title: stock ? `${stock.name} Share Price, PE and Fundamentals` : "Indian Stock Detail", description: stock?.summary ?? "Indian stock detail with price, valuation, profitability and ownership reference data.", alternates: { canonical: `/stocks/${symbol}` } }; }
export default async function IndianStockDetailRoute({ params }: { params: Promise<{ symbol: string }> }) { const { symbol } = await params; const stock = indianStocks.find((item) => item.slug === symbol); if (!stock) notFound(); return <FinancePlatform screen="stock-detail"><StocksModule view="detail" stock={stock} /></FinancePlatform>; }
