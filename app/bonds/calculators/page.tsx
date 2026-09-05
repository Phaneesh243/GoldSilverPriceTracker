import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import BondsModule from "../../_components/BondsModule";

export const metadata: Metadata = { title: "Bond Return and Coupon Calculator India", description: "Estimate annual coupon income, maturity value and illustrative post-tax bond income in India.", alternates: { canonical: "/bonds/calculators" } };

export default function BondCalculatorsPage() { return <FinancePlatform screen="bonds"><BondsModule view="calculator" /></FinancePlatform>; }
