import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinancePlatform from "../../_components/FinancePlatform";
import MutualFundsModule from "../../_components/MutualFundsModule";
import { mutualFunds } from "../../../lib/mutual-funds";
export function generateStaticParams() { return mutualFunds.map((fund) => ({ slug: fund.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const fund = mutualFunds.find((item) => item.slug === slug); return { title: fund ? `${fund.name} Mutual Fund` : "Mutual Fund Detail", description: fund?.summary ?? "Mutual-fund detail with NAV, returns, risk and cost reference data.", alternates: { canonical: `/mutual-funds/${slug}` } }; }
export default async function MutualFundDetailRoute({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const fund = mutualFunds.find((item) => item.slug === slug); if (!fund) notFound(); return <FinancePlatform screen="fund-detail"><MutualFundsModule view="detail" fund={fund} /></FinancePlatform>; }
