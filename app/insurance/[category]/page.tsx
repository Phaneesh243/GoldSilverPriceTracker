import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinancePlatform from "../../_components/FinancePlatform";
import InsuranceModule from "../../_components/InsuranceModule";
import { getInsuranceCategory } from "../../../lib/insurance";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: value } = await params;
  const category = getInsuranceCategory(value);
  return category ? { title: `${category.name} Guide India`, description: `${category.summary} Learn the benefits, disadvantages, exclusions, claims and comparison factors.`, alternates: { canonical: category.route } } : { title: "Insurance category not found" };
}

export default async function InsuranceCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: value } = await params;
  const category = getInsuranceCategory(value);
  if (!category) notFound();
  return <FinancePlatform screen="insurance"><InsuranceModule view="category" category={category} /></FinancePlatform>;
}
