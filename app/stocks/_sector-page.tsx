import { notFound } from "next/navigation";
import FinancePlatform from "../_components/FinancePlatform";
import StocksModule from "../_components/StocksModule";
import { stockSectors } from "../../lib/indian-stocks";
export default function StockSectorRoute({ sectorSlug }: { sectorSlug: string }) { const sector = stockSectors.find((item) => item.toLowerCase().replaceAll(" ", "-") === sectorSlug); if (!sector) notFound(); return <FinancePlatform screen="stocks"><StocksModule view="sector" sector={sector} /></FinancePlatform>; }
