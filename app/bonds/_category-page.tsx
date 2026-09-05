import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinancePlatform from "../_components/FinancePlatform";
import BondsModule from "../_components/BondsModule";
import { bondCategories } from "../../lib/bonds";

export const metadata: Metadata = { title: "Bond Category Guide India", description: "Bond category guide with benefits, disadvantages and investor considerations in India." };
export default function BondCategoryRoute({ categorySlug }: { categorySlug: string }) { const category = bondCategories.find((item) => item.route.endsWith(categorySlug)); if (!category) notFound(); return <FinancePlatform screen="bonds"><BondsModule view="category" category={category} /></FinancePlatform>; }
