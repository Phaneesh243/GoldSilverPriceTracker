import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Silver news", "Latest silver price news, industrial demand, bullion updates and silver market outlook.", "silver");
export default function Page() { return <NewsCategoryPage title="Silver news" description="Latest silver price news, industrial demand, bullion updates and silver market outlook." metal="silver" />; }
