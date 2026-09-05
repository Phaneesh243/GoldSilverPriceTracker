import FinancePlatform from "../_components/FinancePlatform";
import { WatchlistManager } from "../_components/WatchlistAlertsClient";

export default function WatchlistPage() {
  return <FinancePlatform screen="watchlist"><WatchlistManager /></FinancePlatform>;
}
