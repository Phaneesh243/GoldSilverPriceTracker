import { Suspense } from "react";
import type { Metadata } from "next";
import VerifyEmail from "./VerifyEmail";
export const metadata: Metadata = { title: "Verify email", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function VerifyPage() { return <Suspense fallback={<p>Loading verification...</p>}><VerifyEmail /></Suspense>; }
