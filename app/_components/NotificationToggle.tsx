"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

const NOTIFICATION_KEY = "gsp-notification-choice-v1";
const NOTIFICATION_CHANGED_EVENT = "gsp-notifications-changed";

function notificationsSupported() {
    return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlBase64ToUint8Array(value: string) {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const output = new Uint8Array(rawData.length);

    for (let index = 0; index < rawData.length; index += 1) {
        output[index] = rawData.charCodeAt(index);
    }

    return output;
}

async function getExistingSubscription() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return null;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    return registration.pushManager.getSubscription();
}

async function showSuccessNotification(registration: ServiceWorkerRegistration) {
    await registration.showNotification("GoldSilverPrices notifications enabled", {
        body: "You will receive gold and silver price updates when alerts are available.",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "gsp-notifications-enabled",
        data: { url: "/", source: "navbar-success" },
    });
}

export default function NotificationToggle({ citySlug = "mumbai" }: { citySlug?: string }) {
    const [mounted, setMounted] = useState<boolean>(false);
    const [supported, setSupported] = useState<boolean>(false);
    const [enabled, setEnabled] = useState<boolean>(false);
    const [busy, setBusy] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        const canNotify = notificationsSupported();
        // Hydration guard: client-only notification APIs are intentionally read after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        setSupported(canNotify);

        if (!canNotify) {
            return;
        }

        async function refreshEnabledState() {
            try {
                const subscription = await getExistingSubscription();
                setEnabled(Boolean(subscription) && Notification.permission === "granted");
            } catch {
                setEnabled(false);
            }
        }

        function refreshOnVisible() {
            if (document.visibilityState === "visible") {
                void refreshEnabledState();
            }
        }

        void refreshEnabledState();
        window.addEventListener(NOTIFICATION_CHANGED_EVENT, refreshEnabledState);
        window.addEventListener("focus", refreshEnabledState);
        document.addEventListener("visibilitychange", refreshOnVisible);

        return () => {
            window.removeEventListener(NOTIFICATION_CHANGED_EVENT, refreshEnabledState);
            window.removeEventListener("focus", refreshEnabledState);
            document.removeEventListener("visibilitychange", refreshOnVisible);
        };
    }, []);

    function showMessage(nextMessage: string) {
        setMessage(nextMessage);
        window.setTimeout(() => setMessage(""), 7000);
    }

    async function enable() {
        let publicKey: string | null = null;
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
            showMessage("Push notifications are not configured on this server yet.");
            return;
        }

        const permission = await Notification.requestPermission();
        window.localStorage.setItem(NOTIFICATION_KEY, permission);
        if (permission !== "granted") {
            showMessage("Notifications are blocked. Allow them in browser settings, then try again.");
            return;
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
                city: citySlug,
                purity: "22K",
            }),
        });

        if (response.ok) {
            window.localStorage.setItem(NOTIFICATION_KEY, "granted");
            setEnabled(true);
            window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGED_EVENT));
            showMessage("Notifications are on. Sending a test notification now.");
            try {
                await showSuccessNotification(registration);
            } catch {
                showMessage("Subscription saved, but the browser did not show the local test notification.");
            }
            return;
        }

        let errorMessage = "Subscription created, but server storage failed. Check Redis/VAPID server env.";
        try {
            const payload = (await response.json()) as { message?: string; error?: string };
            errorMessage = payload.message || payload.error || errorMessage;
        } catch {
            // Keep the safe generic message.
        }

        showMessage(errorMessage);
    }

    async function disable() {
        const subscription = await getExistingSubscription();
        if (!subscription) {
            setEnabled(false);
            return;
        }

        await fetch("/api/notifications/subscribe", {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => undefined);

        try {
            await subscription.unsubscribe();
        } catch {
            // ignore
        }

        window.localStorage.setItem(NOTIFICATION_KEY, "off");
        setEnabled(false);
        window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGED_EVENT));
    }

    async function toggle() {
        if (busy) return;
        setBusy(true);
        try {
            if (enabled) {
                await disable();
            } else {
                await enable();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown notification error";
            showMessage(`Could not update notifications: ${errorMessage}`);
        } finally {
            setBusy(false);
        }
    }

    if (!mounted) {
        return (
            <button type="button" className="icon-btn" disabled aria-label="Checking notification support" title="Checking notification support">
                <BellOff size={18} />
            </button>
        );
    }

    if (!supported) return null;

    const label = enabled ? "Turn off price notifications" : "Turn on price notifications";

    return (
        <span className="notification-toggle">
            <button
                type="button"
                className="icon-btn"
                onClick={toggle}
                disabled={busy}
                aria-label={label}
                title={message || label}
            >
                {enabled ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
            {message ? (
                <span className="notification-hint" role="status">
                    {message}
                </span>
            ) : null}
        </span>
    );
}
