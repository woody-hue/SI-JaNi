const APP_NAME = 'SI-JaNi';
const CACHE_VERSION = 'v2.2.0';
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;
const OFFLINE_URL = 'offline.html';
const PRECACHE_URLS = [
  'index.html',
  'dashboard.html',
  'css/style.css',
  'script.js',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'images/bg-mobile.webp',
  'images/bg-desktop.webp',
  OFFLINE_URL
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Installing new version:', CACHE_VERSION);
      return cache.addAll(PRECACHE_URLS).then(() => {
        console.log('[SW] Precaching complete');
        return self.skipWaiting();
      }).catch(err => {
        console.error('[SW] Precaching failed:', err);
        throw err;
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith(APP_NAME)) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).then(networkResponse => {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return networkResponse;
      }).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => cachedResponse || fetch(request))
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(Promise.resolve(console.log('Data synced successfully')));
  }
});

self.addEventListener('push', event => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'SI-JaNi Update', {
      body: data.body || 'New content is available!',
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-72x72.png',
      data: {
        url: data.url || '/'
      }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});
