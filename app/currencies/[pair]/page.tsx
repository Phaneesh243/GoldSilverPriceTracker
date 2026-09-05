import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinancePlatform from "../../_components/FinancePlatform";
import CurrencyDashboard from "../../_components/CurrencyDashboard";
import { getCurrencyPair } from "../../../lib/currencies";

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair: value } = await params;
  const pair = getCurrencyPair(value);
  if (!pair) return { title: "Currency pair not found" };
  return { title: `${pair.symbol} Exchange Rate Today`, description: `Track the latest ${pair.symbol} reference exchange rate, historical movement and conversion value.`, alternates: { canonical: `/currencies/${pair.slug}` } };
}

export default async function CurrencyPairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair: value } = await params;
  const pair = getCurrencyPair(value);
  if (!pair) notFound();
  return <FinancePlatform screen="currencies"><CurrencyDashboard detailPair={pair.slug} /></FinancePlatform>;
}
