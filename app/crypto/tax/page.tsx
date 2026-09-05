import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "Crypto Tax and 1% TDS Calculator India", description: "Estimate illustrative VDA tax, 1% TDS and crypto transaction record requirements in India.", alternates: { canonical: "/crypto/tax" } };
export default function CryptoTaxPage() { return <FinancePlatform screen="crypto"><CryptoModule view="tax" /></FinancePlatform>; }
