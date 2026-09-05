import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Currency news", "Latest India rupee, INR, RBI, forex and dollar currency market news.", "currencies");
export default function Page() { return <NewsCategoryPage title="Currency news" description="Latest India rupee, INR, RBI, forex and dollar currency market news." category="currencies" />; }
