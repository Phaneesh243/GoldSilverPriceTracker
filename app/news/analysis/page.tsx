import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Market analysis", "Gold, silver and commodity outlooks, forecasts and analyst market analysis.", "analysis");
export default function Page() { return <NewsCategoryPage title="Market analysis" description="Gold, silver and commodity outlooks, forecasts and analyst market analysis." category="analysis" />; }
