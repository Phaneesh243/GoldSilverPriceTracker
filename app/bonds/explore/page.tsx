import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import BondsModule from "../../_components/BondsModule";

export const metadata: Metadata = { title: "Explore Bonds by Yield, Maturity and Rating", description: "Browse reference government and corporate bond profiles in India by type, issuer, yield, maturity and rating.", alternates: { canonical: "/bonds/explore" } };

export default function BondExplorePage() { return <FinancePlatform screen="bonds"><BondsModule view="explore" /></FinancePlatform>; }
