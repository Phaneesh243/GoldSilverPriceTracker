import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Stocks news", "Latest India stock market news, NSE, BSE, Nifty, Sensex and company earnings updates.", "stocks");
export default function Page() { return <NewsCategoryPage title="Stocks news" description="Latest India stock market news, NSE, BSE, Nifty, Sensex and company earnings updates." category="stocks" />; }
