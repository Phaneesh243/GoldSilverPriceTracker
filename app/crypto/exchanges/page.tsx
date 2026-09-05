import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "Crypto Exchanges, Wallets and Platforms India", description: "Compare crypto access, custody, fees, KYC, withdrawals and compliance checks for Indian users.", alternates: { canonical: "/crypto/exchanges" } };
export default function CryptoExchangesPage() { return <FinancePlatform screen="crypto"><CryptoModule view="exchanges" /></FinancePlatform>; }
