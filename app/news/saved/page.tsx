import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import SavedNewsClient from "../../_components/SavedNewsClient";

export const metadata: Metadata = { title: "Saved News | GoldSilverPrices", description: "Your saved market news stories.", robots: { index: false, follow: true } };
export default function Page() { return <FinancePlatform screen="news"><div className="news-public-content"><SavedNewsClient /></div></FinancePlatform>; }
