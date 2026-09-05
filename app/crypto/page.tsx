import type { Metadata } from "next";
import FinancePlatform from "../_components/FinancePlatform";
import { CryptoLivePanel } from "../_components/CryptoLiveTools";
import CryptoLandingModule from "../_components/CryptoLandingModule";

export const metadata: Metadata = { title: "Crypto Prices, Tax and Portfolio India", description: "Track crypto prices in INR, compare digital assets, calculate VDA tax, manage portfolios and learn crypto security in India.", alternates: { canonical: "/crypto" } };

export default function CryptoPage() {
  return <FinancePlatform screen="crypto"><CryptoLivePanel /><CryptoLandingModule /></FinancePlatform>;
}
