import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import BondsModule from "../../_components/BondsModule";

export const metadata: Metadata = { title: "Compare Bonds in India", description: "Compare bond coupon, yield to maturity, issuer, maturity, rating, minimum investment and risk factors.", alternates: { canonical: "/bonds/compare" } };

export default function BondComparePage() { return <FinancePlatform screen="bonds"><BondsModule view="compare" /></FinancePlatform>; }
