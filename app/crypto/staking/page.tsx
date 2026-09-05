import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "Crypto Staking, APY and Validator Guide", description: "Understand crypto staking APY, lock-ups, validators, commissions, slashing and reward risks.", alternates: { canonical: "/crypto/staking" } };
export default function CryptoStakingPage() { return <FinancePlatform screen="crypto"><CryptoModule view="staking" /></FinancePlatform>; }
