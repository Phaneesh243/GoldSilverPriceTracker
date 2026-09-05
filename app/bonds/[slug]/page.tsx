import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinancePlatform from "../../_components/FinancePlatform";
import BondsModule from "../../_components/BondsModule";
import { bonds } from "../../../lib/bonds";

export function generateStaticParams() { return bonds.map((bond) => ({ slug: bond.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const bond = bonds.find((item) => item.slug === slug); return { title: bond ? `${bond.name} Bond Profile` : "Bond Profile", description: bond?.summary ?? "Bond profile with yield, maturity, rating and risk reference information.", alternates: { canonical: `/bonds/${slug}` } }; }

export default async function BondDetailRoute({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const bond = bonds.find((item) => item.slug === slug); if (!bond) notFound(); return <FinancePlatform screen="bonds"><BondsModule view="detail" bond={bond} /></FinancePlatform>; }
