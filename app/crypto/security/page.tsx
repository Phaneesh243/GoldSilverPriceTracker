import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "Crypto Security and Scam Prevention India", description: "Learn seed phrase, wallet, phishing, smart-contract and crypto scam safety practices.", alternates: { canonical: "/crypto/security" } };
export default function CryptoSecurityPage() { return <FinancePlatform screen="crypto"><CryptoModule view="security" /></FinancePlatform>; }
