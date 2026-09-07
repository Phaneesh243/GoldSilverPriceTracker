"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { accountRequest, invalidateAccountData } from "../../_hooks/useAccountResource";
export default function VerifyEmail() {
  const params = useSearchParams();
  const [message, setMessage] = useState("Sign in to the matching account, then confirm your email.");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [done, setDone] = useState(false);
  async function verify() {
    setBusy(true);
    try {
      if (!verified) {
        await accountRequest("/api/notifications/email-verification", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: params.get("token") }) });
        setVerified(true);
      }
      await accountRequest("/api/storage/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ notifications: { marketUpdates: true, emailAlerts: true } }) });
      invalidateAccountData(); setDone(true); setMessage("Email verified and daily email updates enabled. Manage updates from the notification bell.");
    }
    catch (error) { setMessage(error instanceof Error ? error.message : "Verification failed."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><section className="auth-card glass-panel"><h1>Verify your email</h1><p>Confirm to receive the two daily market editions by email. Unsubscribe anytime.</p><p role="status">{message}</p><button className="primary-button" disabled={busy || done} onClick={() => void verify()}>{done ? "Email updates enabled" : busy ? "Confirming..." : "Confirm email and allow updates"}</button><p><Link href="/login">Sign in</Link> · <Link href="/">Return to markets</Link></p></section></main>;
}
