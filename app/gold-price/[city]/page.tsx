import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cityRates } from "../../../lib/market-data";
import MetalPageShell from "../../_components/MetalPageShell";
import MetalCalculator from "../../_components/MetalCalculator";
type Props = { params: Promise<{ city: string }> };
export function generateStaticParams() { return cityRates.map(city => ({ city: city.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const selected = cityRates.find(item => item.slug === city);
  return selected ? { title: `Gold quotation tools for ${selected.name}`, description: `Manual jewellery quotation tools for ${selected.name}. No verified local retail feed is enabled.`, alternates: { canonical: `/gold-price/${selected.slug}` }, robots: { index: false, follow: true } } : {};
}
export default async function Page({ params }: Props) {
  const { city } = await params;
  const selected = cityRates.find(item => item.slug === city);
  if (!selected) notFound();
  return <MetalPageShell title={`Gold quotation tools for ${selected.name}`} description="A converted national reference is not a local jeweller quotation.">
    <section className="metals-disclosure"><h2>Local quotation unavailable</h2><p>No verified reusable city-price feed is enabled. Ask a local seller for the purity-specific rate, net weight, itemised charges and quote time. We do not invent city prices or trends.</p><Link href="/metals/learn/invoice">Understand your quotation</Link></section>
    <MetalCalculator metal="gold" price={null} />
    <section><h2>Compare quotations consistently</h2><p>Use the same purity, weight unit and quotation date. Keep stone value and making charges separate from the metal value. Save an estimate in the <Link href="/calculators/gold-jewellery">complete jewellery calculator</Link>.</p></section>
  </MetalPageShell>;
}
