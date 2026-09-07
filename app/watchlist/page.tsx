import FinancePlatform from "../_components/FinancePlatform";
import { WatchlistManager } from "../_components/WatchlistAlertsClient";

export const metadata = { title: "Your watchlist", robots: { index: false, follow: false } };

export default function WatchlistPage() {
  return <FinancePlatform screen="watchlist"><WatchlistManager /></FinancePlatform>;
}
