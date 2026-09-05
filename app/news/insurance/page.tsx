import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Insurance news", "Latest India health, life and general insurance, IRDAI, premium and claims news.", "insurance");
export default function Page() { return <NewsCategoryPage title="Insurance news" description="Latest India health, life and general insurance, IRDAI, premium and claims news." category="insurance" />; }
