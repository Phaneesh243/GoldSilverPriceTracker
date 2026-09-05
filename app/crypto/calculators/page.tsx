import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "Crypto P&L, DCA, Leverage and Fee Calculators", description: "Calculate crypto profit, DCA scenarios, fees, TDS, liquidation and staking outcomes.", alternates: { canonical: "/crypto/calculators" } };
export default function CryptoCalculatorsPage() { return <FinancePlatform screen="crypto"><CryptoModule view="calculators" /></FinancePlatform>; }
