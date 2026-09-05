import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Investing news", "Investment, ETF, portfolio and fund news with context for long-term investors.", "investing");
export default function Page() { return <NewsCategoryPage title="Investing news" description="Investment, ETF, portfolio and fund news with context for long-term investors." category="investing" />; }
