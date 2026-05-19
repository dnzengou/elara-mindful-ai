// Elara service worker — app-shell + offline fallback
const CACHE = 'elara-v2';
const OFFLINE = '/offline.html';
const SHELL = ['/', '/index.html', OFFLINE];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip cross-origin (API calls, CDNs) — never cache these
  if (url.origin !== self.location.origin) return;

  // Navigation requests — serve app shell, offline fallback if network fails
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          // Fresh response — update cache
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request)
            .then(cached => cached ?? caches.match(OFFLINE))
        )
    );
    return;
  }

  // Static assets — cache first, then network, background update
  e.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(res => {
        if (res.ok && res.type === 'basic') {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
        }
        return res;
      }).catch(() => cached); // network failed, return stale cache

      return cached ?? network;
    })
  );
});

// Handle push notifications (future: daily reminders)
self.addEventListener('push', e => {
  const data = e.data?.json() ?? { title: 'Elara', body: 'Time for a mindful moment.' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'elara-reminder',
      renotify: false,
      silent: false,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow('/');
    })
  );
});
