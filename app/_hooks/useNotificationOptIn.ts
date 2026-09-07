"use client";
import { useState } from "react";
import { allowMarketUpdates } from "../../lib/notification-opt-in";
import { accountRequest, invalidateAccountData } from "./useAccountResource";

export const CONSENT_UPDATED = "gsp-market-consent-updated";
export const consentKey = (userId: string) => `gsp-market-consent-v3:${userId}`;
export const noticeKey = (userId: string) => `${consentKey(userId)}:notice`;
export function rememberConsent(userId: string, message: string) {
  try { localStorage.setItem(consentKey(userId), "accepted"); localStorage.setItem(noticeKey(userId), message); } catch { /* private browsing */ }
  window.dispatchEvent(new Event(CONSENT_UPDATED));
}
export async function subscribeThisBrowser() {
  const response = await fetch("/api/notifications/status", { cache: "no-store" });
  const status = await response.json();
  if (!response.ok || !status.configured || !status.vapidPublicKey) throw new Error("Browser push is not configured on this server.");
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const raw = atob(status.vapidPublicKey.replace(/-/g, "+").replace(/_/g, "/"));
  const current = await registration.pushManager.getSubscription();
  const subscription = current || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, (character) => character.charCodeAt(0)) });
  await accountRequest("/api/notifications/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subscription: subscription.toJSON() }) });
}
export function browserPermission() {
  if (!("Notification" in window && "serviceWorker" in navigator && "PushManager" in window)) return Promise.resolve("unsupported" as const);
  return Notification.permission === "default" ? Notification.requestPermission() : Promise.resolve(Notification.permission);
}
export function useNotificationOptIn(user: { id: string; emailVerified: boolean } | null | undefined) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function allow(onSaved?: () => void) {
    if (!user || busy) return false;
    setBusy(true); setMessage("");
    try {
      const result = await allowMarketUpdates(user.emailVerified, {
        permission: browserPermission, subscribeBrowser: subscribeThisBrowser,
        save: (notifications) => accountRequest("/api/storage/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ notifications }) }),
        verifyEmail: () => accountRequest("/api/notifications/email-verification", { method: "POST" }),
        onSaved: () => { rememberConsent(user.id, "Market updates enabled. Finishing delivery setup..."); onSaved?.(); },
      });
      setMessage(result.message);
      if (result.accepted) rememberConsent(user.id, result.message);
      invalidateAccountData();
      return result.accepted;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save. Please retry."); return false; }
    finally { setBusy(false); }
  }
  return { allow, busy, message };
}
