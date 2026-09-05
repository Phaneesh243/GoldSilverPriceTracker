import { notFound } from "next/navigation";
import FinancePlatform from "../../_components/FinancePlatform";
import StocksModule from "../../_components/StocksModule";
import { indianStocks } from "../../../lib/indian-stocks";

export default function StockDetailPage() {
  const stock = indianStocks.find((item) => item.slug === "reliance");
  if (!stock) notFound();
  return <FinancePlatform screen="stock-detail"><StocksModule view="detail" stock={stock} /></FinancePlatform>;
}
