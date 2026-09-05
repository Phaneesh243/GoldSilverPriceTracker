import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import BondsModule from "../../_components/BondsModule";

export const metadata: Metadata = { title: "Bond Issuers and Investment Platforms India", description: "Understand government bond access, corporate bond issuers and investment platform checks in India.", alternates: { canonical: "/bonds/providers" } };

export default function BondProvidersPage() { return <FinancePlatform screen="bonds"><BondsModule view="providers" /></FinancePlatform>; }
