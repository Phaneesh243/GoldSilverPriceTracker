import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import MutualFundsModule from "../../_components/MutualFundsModule";
export const metadata: Metadata = { title: "Mutual Fund AMCs, RTAs and Platforms India", description: "Explore mutual-fund AMCs, investor-service platforms and registrar resources in India.", alternates: { canonical: "/mutual-funds/providers" } };
export default function MutualFundsProvidersPage() { return <FinancePlatform screen="mutual-funds"><MutualFundsModule view="providers" /></FinancePlatform>; }
