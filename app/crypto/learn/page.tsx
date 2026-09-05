import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "Crypto Learning Centre India", description: "Learn about Bitcoin, wallets, crypto risk, DeFi, staking, NFTs and India tax basics.", alternates: { canonical: "/crypto/learn" } };
export default function CryptoLearnPage() { return <FinancePlatform screen="crypto"><CryptoModule view="learn" /></FinancePlatform>; }
