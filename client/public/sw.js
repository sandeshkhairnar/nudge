const CACHE_NAME = "nudge-pwa-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Simple network-first strategy for PWA requirements
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Push notification handling
self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();
  const targetUrl = new URL(data.url || "/space/inbox", self.location.origin);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      let isFocused = false;

      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        const clientUrl = new URL(client.url);
        
        // Check if a tab is currently focused on the same path
        if (client.focused && clientUrl.pathname === targetUrl.pathname) {
          isFocused = true;
          break;
        }
      }

      if (isFocused) {
        // Suppress notification since the user is already viewing the page
        return;
      }

      const options = {
        body: data.body,
        icon: data.icon || "/icon-192.png",
        badge: "/icon-192.png",
        vibrate: [100, 50, 100],
        requireInteraction: false,
        actions: [
          { action: "open", title: "View Details" },
          { action: "close", title: "Dismiss" }
        ],
        data: {
          url: data.url || "/space/inbox",
        },
      };
      return self.registration.showNotification(data.title, options);
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // Open the URL or focus existing tab if it's open
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
