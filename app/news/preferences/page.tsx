import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import NewsPreferencesClient from "../../_components/NewsPreferencesClient";

export const metadata: Metadata = { title: "News Preferences | GoldSilverPrices", description: "Manage your market news and notification preferences.", robots: { index: false, follow: true } };
export default function Page() { return <FinancePlatform screen="news"><div className="news-public-content"><NewsPreferencesClient /></div></FinancePlatform>; }
