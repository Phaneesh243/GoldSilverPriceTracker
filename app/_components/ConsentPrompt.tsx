"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, X } from "lucide-react";

const CONSENT_KEY = "gsp-consent-v1";
const NOTIFICATION_KEY = "gsp-notification-choice-v1";
const NOTIFICATION_CHANGED_EVENT = "gsp-notifications-changed";
export const REQUEST_NOTIFICATIONS_EVENT = "gsp-request-notifications";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function showSuccessNotification(registration: ServiceWorkerRegistration) {
  await registration.showNotification("GoldSilverPrices notifications enabled", {
    body: "You will receive gold and silver price updates when alerts are available.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "gsp-notifications-enabled",
    data: { url: "/", source: "consent-success" },
  });
}

async function registerPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, message: "Push notifications are not supported in this browser." };
  }

  // Keep the runtime endpoint as the source of truth, with the public build
  // value as a fallback when a browser has an older cached route response.
  let publicKey: string | null = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
  try {
    const statusResponse = await fetch("/api/notifications/status", { cache: "no-store" });
    if (statusResponse.ok) {
      const status = (await statusResponse.json()) as { vapidPublicKey?: unknown };
      publicKey = typeof status.vapidPublicKey === "string" ? status.vapidPublicKey : null;
    }
  } catch {
    // Keep the user-facing message below when the status endpoint is unavailable.
  }

  if (!publicKey) {
    return { ok: false, message: "Notification permission saved. Push notifications are not configured on this server yet." };
  }

  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const response = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      city: "mumbai",
      purity: "22K",
    }),
  });

  if (!response.ok) {
    let message = "Permission saved. Server subscription storage is not configured yet.";
    try {
      const payload = (await response.json()) as { message?: string; error?: string };
      message = payload.message || payload.error || message;
    } catch {
      // Keep the safe generic message.
    }
    return { ok: false, message };
  }

  window.localStorage.setItem(NOTIFICATION_KEY, "granted");
  window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGED_EVENT));
  try {
    await showSuccessNotification(registration);
  } catch {
    // The push subscription is still valid even if the local test notification is suppressed.
  }

  return { ok: true, message: "Notifications are enabled for live market updates." };
}

export default function ConsentPrompt() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function showNotificationPrompt() {
      setMessage("");
      setVisible(true);
    }

    window.addEventListener(REQUEST_NOTIFICATIONS_EVENT, showNotificationPrompt);
    const timer = window.localStorage.getItem(CONSENT_KEY) ? undefined : window.setTimeout(() => setVisible(true), 5000);

    return () => {
      window.removeEventListener(REQUEST_NOTIFICATIONS_EVENT, showNotificationPrompt);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  async function allowNotifications() {
    setBusy(true);
    window.localStorage.setItem(CONSENT_KEY, "accepted");

    try {
      if (!("Notification" in window)) {
        setMessage("This browser does not support notifications.");
        return;
      }

      const permission = await Notification.requestPermission();
      window.localStorage.setItem(NOTIFICATION_KEY, permission);

      if (permission !== "granted") {
        setMessage("Notifications were not enabled. You can allow them later in browser settings.");
        return;
      }

      const result = await registerPushSubscription();
      setMessage(result.message);
    } catch {
      setMessage("Could not enable notifications right now. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    window.localStorage.setItem(CONSENT_KEY, "dismissed");
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="consent-panel" role="dialog" aria-label="Market alert preferences" aria-live="polite">
      <button className="consent-close" onClick={close} aria-label="Close consent message">
        <X size={16} />
      </button>
      <div className="consent-icons" aria-hidden="true">
        <Mail size={18} />
        <Bell size={18} />
      </div>
      <div>
        <strong>Get provider-backed market alerts</strong>
        <p>Allow browser alerts for price rules and market updates. Email alerts remain a separate choice in Notification settings. You can disable either channel at any time.</p>
        {message ? <small>{message}</small> : null}
      </div>
      <div className="consent-actions">
        <button onClick={close}>Not now</button>
        <button className="primary" onClick={allowNotifications} disabled={busy}>
          {busy ? "Enabling..." : "Allow alerts"}
        </button>
      </div>
    </div>
  );
}
