const CACHE_NAME = 'mtk-delegasi-v5-auto';
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
// 1. LIFECYCLE (INSTALL & ACTIVATE - AUTO UPDATE)
// ==========================================
self.addEventListener('install', (event) => {
  // Langsung aktifkan service worker baru tanpa menunggu tab/app lama ditutup
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
    caches.keys().then((keys) => {
      // Hapus seluruh cache versi lama agar HP langsung menggunakan kode & aset terbaru
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log('[SW Auto-Update] Menghapus cache versi lama:', k);
          return caches.delete(k);
        })
      );
    }).then(() => {
      // Segera klaim seluruh klien/halaman yang sedang terbuka
      return self.clients.claim();
    }).then(() => {
      // Beritahukan ke semua halaman/HP bahwa versi baru sudah aktif
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_VERSION_ACTIVATED',
            cacheName: CACHE_NAME,
            timestamp: Date.now()
          });
        });
      });
    })
  );
});

// ==========================================
// 2. PESAN KONTROL DARI APLIKASI (MANUAL/AUTO)
// ==========================================
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE_AND_RELOAD') {
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CACHE_CLEARED_SUCCESS' });
        });
      });
    });
  }
});

// ==========================================
// 3. NETWORK & CACHE STRATEGY (NETWORK-FIRST FOR UPDATES)
// ==========================================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Jangan pernah cache permintaan Firebase / Firestore / Google APIs
  if (
    !event.request.url.startsWith(self.location.origin) ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com')
  ) {
    return;
  }

  // 1. Navigation Request (index.html / rute halaman):
  // Wajib Network-First agar selalu mendapat versi HTML dan chunk JS terbaru dari server
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
          // Hanya jika benar-benar offline tanpa internet, gunakan cache
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          return fallback || new Response('Aplikasi MTK sedang berjalan secara offline', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // 2. Aset Statis (JS, CSS, Gambar, Ikon, dsb):
  // Stale-While-Revalidate dengan prioritas pembaruan di latar belakang
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

      // Jika ada di cache kembalikan secepatnya, tapi jaringan tetap memperbarui cache
      return cachedResponse || fetchPromise;
    })
  );
});

// ==========================================
// 4. BACKGROUND SYNC (Kirim Data saat Online)
// ==========================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-delegasi-data') {
    event.waitUntil(syncPendingDelegasiData());
  }
});

async function syncPendingDelegasiData() {
  try {
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
// 5. PERIODIC BACKGROUND SYNC (Pembaruan Berkala)
// ==========================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-delegasi-cache') {
    event.waitUntil(fetchLatestDelegasiUpdates());
  }
});

async function fetchLatestDelegasiUpdates() {
  try {
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
// 6. PUSH NOTIFICATIONS
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
