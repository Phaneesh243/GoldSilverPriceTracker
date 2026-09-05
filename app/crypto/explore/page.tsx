import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "Explore Crypto Prices and Market Data in INR", description: "Explore crypto assets by network, market capitalisation, volume, category and INR price.", alternates: { canonical: "/crypto/explore" } };
export default function CryptoExplorePage() { return <FinancePlatform screen="crypto"><CryptoModule view="explore" /></FinancePlatform>; }
