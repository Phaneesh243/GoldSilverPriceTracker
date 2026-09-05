import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "Crypto Regulation, Tax and Compliance India", description: "Source-dated information about VDA tax, TDS, FIU compliance and crypto reporting in India.", alternates: { canonical: "/crypto/regulation" } };
export default function CryptoRegulationPage() { return <FinancePlatform screen="crypto"><CryptoModule view="regulation" /></FinancePlatform>; }
