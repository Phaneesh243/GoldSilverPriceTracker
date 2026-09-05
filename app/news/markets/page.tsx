import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Markets news", "Financial markets, commodities, currencies and macroeconomic updates for informed decisions.", "markets");
export default function Page() { return <NewsCategoryPage title="Markets news" description="Financial markets, commodities, currencies and macroeconomic updates for informed decisions." category="markets" />; }
