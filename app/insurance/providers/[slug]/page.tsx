import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinancePlatform from "../../../_components/FinancePlatform";
import InsuranceModule from "../../../_components/InsuranceModule";
import { getInsuranceProvider } from "../../../../lib/insurance";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const provider = getInsuranceProvider(slug);
  return provider ? { title: `${provider.name} Insurance Profile`, description: `${provider.name} segments, reference metrics, source dates and comparison context.`, alternates: { canonical: `/insurance/providers/${provider.slug}` } } : { title: "Insurance provider not found" };
}

export default async function InsuranceProviderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const provider = getInsuranceProvider(slug);
  if (!provider) notFound();
  return <FinancePlatform screen="insurance"><InsuranceModule view="provider" provider={provider} /></FinancePlatform>;
}
