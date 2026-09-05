import FinancePlatform from "../_components/FinancePlatform";
import { AlertsManager } from "../_components/WatchlistAlertsClient";

export default function AlertsPage() {
  return <FinancePlatform screen="alerts"><AlertsManager /></FinancePlatform>;
}
