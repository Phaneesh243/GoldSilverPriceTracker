import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import CryptoModule from "../../_components/CryptoModule";
export const metadata: Metadata = { title: "NFT and Web3 Guide India", description: "Learn NFT pricing, collections, royalties, contract verification, gaming and Web3 risks.", alternates: { canonical: "/crypto/nft" } };
export default function CryptoNftPage() { return <FinancePlatform screen="crypto"><CryptoModule view="nft" /></FinancePlatform>; }
