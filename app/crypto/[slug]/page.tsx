import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
import { cryptoAssets } from "../../../lib/crypto";
export function generateStaticParams() { return cryptoAssets.map((asset) => ({ slug: asset.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const asset = cryptoAssets.find((item) => item.slug === slug); return { title: asset ? `${asset.name} Price in India and Crypto Guide` : "Crypto Asset Detail", description: asset?.summary ?? "Crypto asset detail with INR price, market data, tokenomics and risk information.", alternates: { canonical: `/crypto/${slug}` } }; }
export default async function CryptoAssetPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const asset = cryptoAssets.find((item) => item.slug === slug); if (!asset) notFound(); return <FinancePlatform screen="crypto"><CryptoModule view="detail" asset={asset} /></FinancePlatform>; }
