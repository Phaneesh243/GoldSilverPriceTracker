import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Crypto news", "Latest India-focused cryptocurrency, Bitcoin, Ethereum and digital asset market updates.", "crypto");
export default function Page() { return <NewsCategoryPage title="Crypto news" description="Latest India-focused cryptocurrency, Bitcoin, Ethereum and digital asset market updates." category="crypto" />; }
