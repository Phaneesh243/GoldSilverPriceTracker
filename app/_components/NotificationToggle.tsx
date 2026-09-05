"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

export const NOTIFICATION_KEY = "gsp-notification-choice-v1";
export const NOTIFICATION_CHANGED_EVENT = "gsp-notifications-changed";

function supported() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

function decodeKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = window.atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

async function subscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

async function savePreference(browserPush: boolean) {
  await fetch("/api/storage/settings", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ notifications: { browserPush } }),
  }).catch(() => undefined);
}

export default function NotificationToggle({ citySlug = "mumbai", variant = "icon" }: { citySlug?: string; variant?: "icon" | "panel" }) {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const canUse = mounted && supported();

  useEffect(() => {
    setMounted(true);
    const refresh = async () => setEnabled(Boolean(await subscription().catch(() => null)) && Notification.permission === "granted");
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    window.addEventListener(NOTIFICATION_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener(NOTIFICATION_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);

  async function enable() {
    if (!supported()) throw new Error("Browser push is not supported on this device.");
    const permission = await Notification.requestPermission();
    window.localStorage.setItem(NOTIFICATION_KEY, permission);
    if (permission !== "granted") throw new Error("Permission is blocked. Enable notifications in your browser site settings.");
    const statusResponse = await fetch("/api/notifications/status", { cache: "no-store" });
    const status = await statusResponse.json() as { vapidPublicKey?: string; message?: string };
    if (!statusResponse.ok || !status.vapidPublicKey) throw new Error(status.message || "Push is not configured on this server.");
    await navigator.serviceWorker.register("/sw.js");
    const registration = await navigator.serviceWorker.ready;
    const current = await registration.pushManager.getSubscription();
    const next = current || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(status.vapidPublicKey) });
    const response = await fetch("/api/notifications/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subscription: next.toJSON(), city: citySlug, purity: "22K" }) });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
      throw new Error(payload.message || payload.error || "The subscription could not be saved.");
    }
    await savePreference(true);
    setEnabled(true);
    window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGED_EVENT));
    await registration.showNotification("GoldSilverPrices alerts enabled", { body: "Browser alerts are ready. Manage channels in the notification panel.", icon: "/favicon.ico", badge: "/favicon.ico", tag: "gsp-push-enabled", data: { url: "/alerts" } }).catch(() => undefined);
  }

  async function disable() {
    const current = await subscription();
    if (current) {
      await fetch("/api/notifications/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: current.endpoint }) }).catch(() => undefined);
      await current.unsubscribe().catch(() => false);
    }
    window.localStorage.setItem(NOTIFICATION_KEY, "off");
    await savePreference(false);
    setEnabled(false);
    window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGED_EVENT));
  }

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (enabled) await disable(); else await enable();
      setMessage(enabled ? "Browser push disabled." : "Browser push enabled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Browser push could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return variant === "panel" ? <div className="notification-setting-row"><span>Browser push</span><small>Checking support…</small></div> : null;
  if (!canUse) return variant === "panel" ? <div className="notification-setting-row"><span>Browser push</span><small>Not supported by this browser.</small></div> : null;
  const label = enabled ? "Disable browser push" : "Enable browser push";

  if (variant === "panel") return (
    <div className="notification-setting-row">
      <span><b>Browser push</b><small>{message || (enabled ? "Enabled on this browser" : "Off on this browser")}</small></span>
      <button className={`notification-switch${enabled ? " active" : ""}`} type="button" role="switch" aria-checked={enabled} aria-label={label} onClick={() => void toggle()} disabled={busy}><span /></button>
    </div>
  );

  return <button className="icon-btn" type="button" onClick={() => void toggle()} disabled={busy} aria-label={label} title={message || label}>{enabled ? <Bell size={18} /> : <BellOff size={18} />}</button>;
}
