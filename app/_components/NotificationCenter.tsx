"use client";
import Link from "next/link";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { UserNotification, UserSettings } from "../../lib/storage";
import { accountRequest, invalidateAccountData, useAccountResource } from "../_hooks/useAccountResource";
import { CONSENT_UPDATED, noticeKey, rememberConsent, useNotificationOptIn, browserPermission, subscribeThisBrowser } from "../_hooks/useNotificationOptIn";

export const NOTIFICATIONS_UPDATED_EVENT = "gsp-notifications-updated";
export default function NotificationCenter({ expanded = false }: { expanded?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const readiness = useAccountResource<{ marketUpdatesConfigured: boolean }>("/api/notifications/status");
  const inbox = useAccountResource<UserNotification[]>("/api/storage/notifications");
  const settings = useAccountResource<UserSettings>("/api/storage/settings");
  const account = useAccountResource<{ user: { id: string; emailVerified: boolean } | null }>("/api/auth/me");
  const optIn = useNotificationOptIn(account.data?.user);
  const [deliveryNotice, setDeliveryNotice] = useState("");
  const userId = account.data?.user?.id;
  useEffect(() => {
    const update = () => { try { setDeliveryNotice(userId ? localStorage.getItem(noticeKey(userId)) || "" : ""); } catch { setDeliveryNotice(""); } };
    update(); window.addEventListener(CONSENT_UPDATED, update); window.addEventListener("storage", update);
    return () => { window.removeEventListener(CONSENT_UPDATED, update); window.removeEventListener("storage", update); };
  }, [userId]);
  const items = (inbox.data || []).filter((item) => item.type !== "alert");
  const archived = (inbox.data || []).filter((item) => item.type === "alert");
  const unread = items.filter((item) => !item.read).length;
  const preferences = settings.data?.notifications;
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("mousedown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  async function mutate(url: string, method: string, body?: unknown) {
    setBusy(true); setMessage("");
    try { await accountRequest(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) }); invalidateAccountData(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); }
    finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true);
    try { await accountRequest("/api/notifications/email-verification", { method: "POST" }); setMessage("Verification email requested. Check your inbox and spam folder."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send verification."); }
    finally { setBusy(false); }
  }
  async function unsubscribe() {
    setBusy(true); setMessage("");
    try {
      await accountRequest("/api/storage/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ notifications: { marketUpdates: false, browserPush: false, emailAlerts: false } }) });
      if (userId) rememberConsent(userId, "Unsubscribed from all market updates.");
      invalidateAccountData();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to unsubscribe."); }
    finally { setBusy(false); }
  }
  async function retryBrowser() {
    setBusy(true); setMessage("");
    try {
      if (await browserPermission() !== "granted") throw new Error("Allow notifications in this site's browser permissions first.");
      await subscribeThisBrowser();
      await accountRequest("/api/storage/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ notifications: { browserPush: true } }) });
      if (userId) rememberConsent(userId, "Browser notifications enabled.");
      invalidateAccountData();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Browser setup failed. Please retry."); }
    finally { setBusy(false); }
  }
  return <div className={expanded ? "market-notifications-page glass-panel" : "notification-center"} ref={root}>
    {!expanded ? <button ref={trigger} className="icon-action notification-center-trigger" aria-label={unread ? `${unread} unread notifications` : "Notifications"} aria-expanded={open} onClick={() => setOpen(!open)}><Bell size={20} />{unread ? <span className="notification-count">{unread > 99 ? "99+" : unread}</span> : null}</button> : null}
    {expanded || open ? <section className={expanded ? "" : "notification-center-panel"} aria-label="Market updates">
      <div className="notification-center-head"><h2>Market updates</h2>{!expanded ? <button aria-label="Close notifications" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={18} /></button> : null}</div>
      {inbox.unauthorized ? <p>Sign in for personal notifications. <Link href="/login">Sign in</Link></p> : <>
        <div className="notification-settings">
          <p>Two fixed editions: 09:15 and 15:30 IST on regular Indian trading days. Stocks, metals, crypto and INR currency rates, where available. Market-open/close labels refer to Indian equities, not crypto or retail metals.</p>
          {readiness.data?.marketUpdatesConfigured === false ? <p role="status">Scheduled delivery setup is pending on this deployment. You can save preferences, but editions will not be sent until it is activated.</p> : null}
          <p>No custom price thresholds or individual asset notifications. Free feeds can be delayed.</p>
          {preferences ? <>
            <p>{preferences.marketUpdates ? "Daily market updates are enabled." : "Allow browser and in-app updates. Email requires a separate choice."}</p>
            <button className={preferences.marketUpdates ? "outline-button" : "primary-button"} disabled={busy || optIn.busy} onClick={() => { setMessage(""); if (preferences.marketUpdates) void unsubscribe(); else void optIn.allow(); }}>{busy || optIn.busy ? "Saving..." : preferences.marketUpdates ? "Unsubscribe" : "Allow"}</button>
            {preferences.marketUpdates && (!preferences.browserPush || deliveryNotice.includes("Browser setup failed")) ? <button className="outline-button" disabled={busy || optIn.busy} onClick={() => void retryBrowser()}>Retry browser</button> : null}
            {preferences.marketUpdates && !account.data?.user?.emailVerified ? <button className="outline-button" disabled={busy || optIn.busy} onClick={() => void verify()}>Request email verification</button> : null}
            {preferences.marketUpdates && account.data?.user?.emailVerified && !preferences.emailAlerts ? <button className="outline-button" disabled={busy || optIn.busy} onClick={() => void mutate("/api/storage/settings", "PATCH", { notifications: { emailAlerts: true } })}>Allow email</button> : null}
            {deliveryNotice ? <p role="status">{deliveryNotice}</p> : null}
          </> : null}
        </div>
        <div className="notification-center-list">
          {inbox.loading ? <p role="status">Loading notifications...</p> : inbox.error ? <p role="alert">{inbox.error} <button onClick={() => void inbox.refresh()}>Retry</button></p> : !items.length ? <p>No market updates yet. Subscribe to receive the next scheduled edition.</p> : items.map((item) => <article key={item.id} className={`notification-item${item.read ? "" : " unread"}`}><div className="notification-item-main"><strong>{item.title}</strong><p style={{ whiteSpace: "pre-line" }}>{item.message}</p><small>{new Date(item.createdAt).toLocaleString("en-IN")}</small>{item.url ? <Link href={item.url}>Read details</Link> : null}</div><div className="notification-item-actions">{!item.read ? <button disabled={busy} aria-label={`Mark ${item.title} read`} onClick={() => void mutate(`/api/storage/notifications/${item.id}`, "PATCH", { read: true })}><Check size={16} /></button> : null}<button disabled={busy} aria-label={`Delete ${item.title}`} onClick={() => void mutate(`/api/storage/notifications/${item.id}`, "DELETE")}><Trash2 size={16} /></button></div></article>)}
        </div>
        {expanded && archived.length ? <details className="notification-archive"><summary>Archived price notifications ({archived.length})</summary><p>Historical records only. Custom price rules have been retired.</p>{archived.map((item) => <article key={item.id}><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString("en-IN")}</small></article>)}</details> : null}
      </>}
      {message || !deliveryNotice && optIn.message || settings.error && !settings.unauthorized ? <p role="status">{message || (!deliveryNotice ? optIn.message : "") || settings.error}</p> : null}
    </section> : null}
  </div>;
}
