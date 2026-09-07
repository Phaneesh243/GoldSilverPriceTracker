"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { UserSettings } from "../../lib/storage";
import { invitationEligible, INVITATION_DELAY_MS } from "../../lib/notification-opt-in";
import { useAccountResource } from "../_hooks/useAccountResource";
import { CONSENT_UPDATED, consentKey, useNotificationOptIn } from "../_hooks/useNotificationOptIn";
export const REQUEST_NOTIFICATIONS_EVENT = "gsp-request-notifications";
export default function ConsentPrompt() {
  const pathname = usePathname();
  const account = useAccountResource<{ user: { id: string; emailVerified: boolean } | null }>("/api/auth/me");
  const settings = useAccountResource<UserSettings>("/api/storage/settings");
  const user = account.data?.user;
  const optIn = useNotificationOptIn(user);
  const [visible, setVisible] = useState(false);
  const [dismissedAt, setDismissedAt] = useState(0);
  const userId = user?.id || "guest";
  const subscribed = settings.data?.notifications.marketUpdates === true;
  const excluded = pathname === "/login" || pathname === "/register" || pathname.startsWith("/notifications/verify");
  function close() {
    const now = Date.now();
    setVisible(false); setDismissedAt(now);
    try { sessionStorage.setItem(`${consentKey(userId)}:due`, String(now + INVITATION_DELAY_MS)); } catch { /* private browsing */ }
  }
  useEffect(() => {
    if (excluded || account.loading || settings.loading || optIn.busy) return;
    const key = consentKey(userId);
    let dueAt = dismissedAt ? dismissedAt + INVITATION_DELAY_MS : Date.now() + 5000;
    try { dueAt = Number(sessionStorage.getItem(`${key}:due`)) || dueAt; } catch { /* private browsing */ }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      clearTimeout(timer);
      let accepted = subscribed;
      try { if (subscribed) localStorage.setItem(key, "accepted"); accepted ||= localStorage.getItem(key) === "accepted"; } catch { /* private browsing */ }
      const blocked = "Notification" in window && Notification.permission === "denied";
      if (accepted || blocked) { setVisible(false); return; }
      if (invitationEligible(accepted, blocked, document.visibilityState === "visible", dueAt, Date.now())) setVisible(true);
      else { setVisible(false); if (document.visibilityState === "visible") timer = setTimeout(check, Math.max(0, dueAt - Date.now())); }
    };
    const manual = () => { if (document.visibilityState === "visible") setVisible(true); };
    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener(CONSENT_UPDATED, check);
    window.addEventListener("storage", check);
    window.addEventListener(REQUEST_NOTIFICATIONS_EVENT, manual);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", check); window.removeEventListener(CONSENT_UPDATED, check); window.removeEventListener("storage", check); window.removeEventListener(REQUEST_NOTIFICATIONS_EVENT, manual); };
  }, [userId, subscribed, excluded, dismissedAt, account.loading, settings.loading, optIn.busy]);
  if (!visible || excluded || account.loading) return null;
  return <aside className="consent-panel simple-market-consent" aria-label="Optional market updates" onKeyDown={(event) => { if (event.key === "Escape" && !optIn.busy) close(); }}>
    <button disabled={optIn.busy} className="consent-close" aria-label="Dismiss market updates invitation" onClick={close}><X size={16} /></button>
    <div><strong>Get daily market updates</strong><p>Allow browser, email and in-app updates at 09:15 and 15:30 IST on regular Indian trading days. Unsubscribe from the bell anytime.</p>{!user ? <p>Sign in to save your choice.</p> : !user.emailVerified ? <p>Email delivery needs a verification link from your inbox.</p> : null}</div>
    {optIn.message ? <p role="status">{optIn.message}</p> : null}
    <div className="consent-actions"><button disabled={optIn.busy} onClick={close}>Not now</button>{user ? <button className="primary-button" disabled={optIn.busy} onClick={async () => { const accepted = await optIn.allow(() => setVisible(false)); if (!accepted && "Notification" in window && Notification.permission === "default") close(); }}>{optIn.busy ? "Allowing..." : "Allow"}</button> : <Link className="primary-button" href={`/login?next=${encodeURIComponent(pathname)}`} onClick={close}>Sign in to allow</Link>}</div>
  </aside>;
}
