import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import NotificationCenter from "../_components/NotificationCenter";

export const metadata: Metadata = { title: "Market updates", robots: { index: false, follow: false } };
export default function NotificationsPage() {
  return <FinancePlatform screen="notifications"><NotificationCenter expanded /></FinancePlatform>;
}
