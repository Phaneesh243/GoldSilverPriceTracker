import type { Metadata } from "next";
import FinancePlatform from "../../_components/FinancePlatform";
import InsuranceModule from "../../_components/InsuranceModule";

export const metadata: Metadata = { title: "Insurance Claims Guide India", description: "Understand cashless, reimbursement, motor and grievance escalation steps for insurance claims in India.", alternates: { canonical: "/insurance/claims" } };

export default function InsuranceClaimsPage() {
  return <FinancePlatform screen="insurance"><InsuranceModule view="claims" /></FinancePlatform>;
}
