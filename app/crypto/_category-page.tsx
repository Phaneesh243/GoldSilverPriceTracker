import { notFound } from "next/navigation";
import FinancePlatform from "../_components/FinancePlatform";
import CryptoModule from "../_components/CryptoModule";
import { cryptoCategories } from "../../lib/crypto";
export default function CryptoCategoryRoute({ categorySlug }: { categorySlug: string }) { const category = cryptoCategories.find((item) => item.route.endsWith(categorySlug)); if (!category) notFound(); return <FinancePlatform screen="crypto"><CryptoModule view="category" category={category} /></FinancePlatform>; }
