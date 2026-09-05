import { notFound } from "next/navigation";
import FinancePlatform from "../_components/FinancePlatform";
import MutualFundsModule from "../_components/MutualFundsModule";
import { fundCategories } from "../../lib/mutual-funds";
export default function FundCategoryRoute({ categorySlug }: { categorySlug: string }) { const category = fundCategories.find((item) => item.route.endsWith(categorySlug)); if (!category) notFound(); return <FinancePlatform screen="mutual-funds"><MutualFundsModule view="category" category={category} /></FinancePlatform>; }
