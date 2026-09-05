import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import MutualFundsModule from "../../_components/MutualFundsModule";
import { mutualFunds } from "../../../lib/mutual-funds";

export const metadata: Metadata = { title: "Mutual Fund Detail", description: "Review mutual-fund NAV, returns, risk, expense ratio, portfolio and official documents.", alternates: { canonical: "/mutual-funds/detail" } };

export default function MutualFundDetailPage() {
  return <FinancePlatform screen="fund-detail"><MutualFundsModule view="detail" fund={mutualFunds[0]} /></FinancePlatform>;
}
