"use client";

import { Bell, Check, ExternalLink, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NotificationToggle from "./NotificationToggle";

export const NOTIFICATIONS_UPDATED_EVENT = "gsp-notifications-updated";

type UserNotification = {
  id: string;
  title: string;
  message: string;
  url: string | null;
  read: boolean;
  createdAt: number;
  delivery?: { inApp: "sent" | "failed"; push: "sent" | "failed" | "skipped"; email: "sent" | "failed" | "skipped" } | null;
};

type NotificationPreferences = {
  priceAlerts: boolean;
  browserPush: boolean;
  emailAlerts: boolean;
  marketDigest: boolean;
  morningDigest: boolean;
  middayDigest: boolean;
  marketCloseDigest: boolean;
  eveningDigest: boolean;
};

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (!response.ok) throw new Error("Notifications are temporarily unavailable.");
  const payload = (await response.json()) as { data?: UserNotification[] | UserNotification };
  return payload.data;
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(timestamp);
}

export default function NotificationCenter() {
  const router = useRouter();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [error, setError] = useState("");
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const unread = items.filter((item) => !item.read).length;

  async function load() {
    try {
      const data = await requestJson("/api/storage/notifications");
      if (Array.isArray(data)) setItems(data);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Notifications are temporarily unavailable.");
    }
  }

  async function loadPreferences() {
    const response = await fetch("/api/storage/settings", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json() as { data?: { notifications?: NotificationPreferences } };
    if (payload.data?.notifications) setPreferences(payload.data.notifications);
  }

  useEffect(() => {
    void load();
    void loadPreferences();
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    const interval = window.setInterval(refresh, 30_000);
    const onVisible = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("mousedown", closeOnOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

  async function updatePreference(key: keyof NotificationPreferences, value: boolean) {
    setPreferences((current) => current ? { ...current, [key]: value } : current);
    const response = await fetch("/api/storage/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ notifications: { [key]: value, ...(key === "marketDigest" ? { dailyDigest: value } : {}) } }) });
    if (!response.ok) { setError("Notification preferences could not be saved."); void loadPreferences(); }
  }

  async function markRead(id: string) {
    try {
      await requestJson(`/api/storage/notifications/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ read: true }) });
      setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update notification.");
    }
  }

  async function remove(id: string) {
    try {
      await requestJson(`/api/storage/notifications/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove notification.");
    }
  }

  async function markAllRead() {
    await Promise.all(items.filter((item) => !item.read).map((item) => markRead(item.id)));
  }

  async function openNotification(item: UserNotification) {
    if (!item.read) await markRead(item.id);
    setOpen(false);
    if (item.url) router.push(item.url);
  }

  return (
    <span className="notification-center" ref={containerRef}>
      <button className="icon-action notification-center-trigger" type="button" aria-label={unread ? `${unread} unread notifications` : "Notifications"} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Bell size={20} />
        {unread ? <span className="notification-count" aria-hidden="true">{unread > 99 ? "99+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="notification-center-panel" role="dialog" aria-label="In-app notifications">
          <div className="notification-center-head">
            <div><span className="finance-eyebrow">IN-APP ALERTS</span><strong>Notifications</strong></div>
            <div className="notification-center-head-actions">
              {unread ? <button type="button" className="notification-text-button" onClick={() => void markAllRead()}><Check size={14} />Mark all read</button> : null}
              <button type="button" className="notification-close" aria-label="Close notifications" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
          </div>
          {error ? <p className="notification-center-error" role="status">{error}</p> : null}
          <div className="notification-center-list">
            {!items.length && !error ? <p className="notification-center-empty">No alerts yet. Enabled price rules will appear here when a live provider condition is met.</p> : null}
            {items.map((item) => (
              <article key={item.id} className={`notification-item${item.read ? "" : " unread"}`}>
                <button type="button" className="notification-item-main" onClick={() => void openNotification(item)}>
                  <span className="notification-item-title">{item.title}</span>
                  <span>{item.message}</span>
                  <small>{formatTime(item.createdAt)}{item.url ? <><ExternalLink size={12} />Open details</> : null}</small>
                  {item.delivery ? <span className="notification-delivery" aria-label="Delivery status"><em>In app</em>{item.delivery.push === "sent" ? <em>Push</em> : null}{item.delivery.email === "sent" ? <em>Email</em> : null}</span> : null}
                </button>
                <div className="notification-item-actions">
                  {!item.read ? <button type="button" aria-label="Mark notification as read" title="Mark as read" onClick={() => void markRead(item.id)}><Check size={14} /></button> : null}
                  <button type="button" aria-label="Delete notification" title="Delete" onClick={() => void remove(item.id)}><Trash2 size={14} /></button>
                </div>
              </article>
            ))}
          </div>
          <div className="notification-settings" aria-label="Notification settings">
            <strong>Notification settings</strong>
            <NotificationToggle variant="panel" />
            {preferences ? <>
              <label><span>Price alerts<small>Rules you create on the Alerts page</small></span><input type="checkbox" checked={preferences.priceAlerts} onChange={(event) => void updatePreference("priceAlerts", event.target.checked)} /></label>
              <label><span>Email alerts<small>Uses your verified signed-in account email</small></span><input type="checkbox" checked={preferences.emailAlerts} onChange={(event) => void updatePreference("emailAlerts", event.target.checked)} /></label>
              <label><span>Market digest<small>Provider-backed market summaries only</small></span><input type="checkbox" checked={preferences.marketDigest} onChange={(event) => void updatePreference("marketDigest", event.target.checked)} /></label>
              {preferences.marketDigest ? <div className="notification-digest-slots">
                {([['morningDigest', 'Morning'], ['middayDigest', 'Midday'], ['marketCloseDigest', 'Market close'], ['eveningDigest', 'Evening']] as const).map(([key, label]) => <label key={key}><span>{label}</span><input type="checkbox" checked={preferences[key]} onChange={(event) => void updatePreference(key, event.target.checked)} /></label>)}
              </div> : null}
            </> : <small>Sign in or wait while preferences load.</small>}
          </div>
        </div>
      ) : null}
    </span>
  );
}
