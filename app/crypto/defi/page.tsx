import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "DeFi Protocols, TVL and Risk Guide", description: "Explore DeFi lending, liquidity, TVL, smart-contract and impermanent-loss concepts.", alternates: { canonical: "/crypto/defi" } };
export default function CryptoDefiPage() { return <FinancePlatform screen="crypto"><CryptoModule view="defi" /></FinancePlatform>; }
