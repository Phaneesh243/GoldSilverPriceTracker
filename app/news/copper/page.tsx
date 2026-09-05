import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Copper news", "Latest copper price news, infrastructure demand and industrial metals market updates.", "copper");
export default function Page() { return <NewsCategoryPage title="Copper news" description="Latest copper price news, infrastructure demand and industrial metals market updates." metal="copper" />; }
