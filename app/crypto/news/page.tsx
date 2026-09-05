import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "Crypto News and Research India", description: "Follow crypto market, India tax, regulation, exchange, security, DeFi and token-unlock research.", alternates: { canonical: "/crypto/news" } };
export default function CryptoNewsPage() { return <FinancePlatform screen="crypto"><CryptoModule view="news" /></FinancePlatform>; }
