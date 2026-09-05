import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Gold news", "Latest gold price news, bullion market updates, jewellery demand and gold outlook.", "gold");
export default function Page() { return <NewsCategoryPage title="Gold news" description="Latest gold price news, bullion market updates, jewellery demand and gold outlook." metal="gold" />; }
