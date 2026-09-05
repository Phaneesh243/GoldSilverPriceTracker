import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "Compare Crypto Assets in India", description: "Compare crypto prices, market cap, volume, network, supply and risk considerations.", alternates: { canonical: "/crypto/compare" } };
export default function CryptoComparePage() { return <FinancePlatform screen="crypto"><CryptoModule view="compare" /></FinancePlatform>; }
