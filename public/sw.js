/* Fixed market editions only. No application response caching. */
self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("push", (event) => {
  let payload;
  try { payload = event.data?.json(); } catch { return; }
  if (!payload?.title || !payload.body || !Number.isFinite(payload.expiresAt) || payload.expiresAt < Date.now()) return;
  event.waitUntil((async () => {
    // Recheck account subscription before displaying a queued message on a shared browser.
    const identity = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" }).then((response) => response.ok ? response.json() : null).catch(() => null);
    if (!payload.userId || identity?.data?.user?.id !== payload.userId) return;
    const response = await fetch("/api/storage/settings", { cache: "no-store", credentials: "include" }).catch(() => null);
    if (!response?.ok) return;
    const settings = await response.json();
    if (!settings.data?.notifications?.marketUpdates || !settings.data?.notifications?.browserPush) return;
    await self.registration.showNotification(payload.title, { body: payload.body, icon: "/favicon.ico", badge: "/favicon.ico", tag: payload.tag, renotify: false, data: { url: "/notifications" } });
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    clients.forEach((client) => client.postMessage({ type: "market-updates-changed" }));
  })());
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const client = clients.find((item) => item.url === self.location.origin + "/notifications");
    return client ? client.focus() : self.clients.openWindow("/notifications");
  })());
});
