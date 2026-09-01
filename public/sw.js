const CACHE_NAME = 'mtk-delegasi-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot-desktop.png',
  '/screenshot-mobile.png'
];

// ==========================================
// 1. LIFECYCLE (INSTALL & ACTIVATE)
// ==========================================
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Install: Pre-caching non-fatal warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ==========================================
// 2. NETWORK & CACHE STRATEGY (FETCH)
// ==========================================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Jangan cache API pihak ketiga (Firebase / Firestore / Google APIs)
  if (
    !event.request.url.startsWith(self.location.origin) ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com')
  ) {
    return;
  }

  // Handle SPA Navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          return fallback || new Response('Aplikasi sedang offline', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, Images, Fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// ==========================================
// 3. BACKGROUND SYNC (Kirim Data saat Online)
// ==========================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-delegasi-data') {
    event.waitUntil(syncPendingDelegasiData());
  }
});

async function syncPendingDelegasiData() {
  try {
    console.log('[SW] Melakukan sinkronisasi data delegasi di background...');
    const allClients = await self.clients.matchAll();
    for (const client of allClients) {
      client.postMessage({
        type: 'BACKGROUND_SYNC_TRIGGERED',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('[SW] Sinkronisasi background gagal:', error);
  }
}

// ==========================================
// 4. PERIODIC BACKGROUND SYNC (Pembaruan Berkala)
// ==========================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-delegasi-cache') {
    event.waitUntil(fetchLatestDelegasiUpdates());
  }
});

async function fetchLatestDelegasiUpdates() {
  try {
    console.log('[SW] Mengambil pembaruan data delegasi berkala...');
    const allClients = await self.clients.matchAll();
    for (const client of allClients) {
      client.postMessage({
        type: 'PERIODIC_SYNC_TRIGGERED',
        timestamp: Date.now()
      });
    }
  } catch (err) {
    console.warn('[SW] Periodic sync tidak dapat menjangkau jaringan:', err);
  }
}

// ==========================================
// 5. PUSH NOTIFICATIONS
// ==========================================
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Manajemen Delegasi MTK',
    body: 'Ada pembaruan data delegasi terbaru.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/?tab=riwayat' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      notificationData = { ...notificationData, ...parsed };
    } catch {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: notificationData.data,
    actions: [
      { action: 'open', title: 'Buka Aplikasi' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Event saat notifikasi diklik pengguna di HP / Desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
