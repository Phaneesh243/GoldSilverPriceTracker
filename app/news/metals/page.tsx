import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Metals news", "Latest gold, silver, platinum and copper market news, price drivers and industry updates.", "metals");
export default function Page() { return <NewsCategoryPage title="Metals news" description="Latest gold, silver, platinum and copper market news, price drivers and industry updates." category="metals" />; }
