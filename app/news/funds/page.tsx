import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Mutual fund news", "Latest India mutual fund, SIP, ETF, NAV and asset-management news.", "funds");
export default function Page() { return <NewsCategoryPage title="Mutual fund news" description="Latest India mutual fund, SIP, ETF, NAV and asset-management news." category="funds" />; }
