/* GoldSilverPrices service worker */
const SW_VERSION = "v2-2026-07-26";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "GoldSilverPrices update",
    body: "Live gold and silver rates have been refreshed.",
    url: "/",
    tag: "gsp-generic",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: payload.tag || "gsp-generic",
      renotify: true,
      data: { url: payload.url || "/", version: SW_VERSION },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.endsWith(url)) {
          return client.focus();
        }
      }

      return self.clients.openWindow(url);
    }),
  );
});

