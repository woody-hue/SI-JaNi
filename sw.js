const APP_NAME = 'SI-JaNi';
const CACHE_VERSION = 'v2.3.0';  // Bump version kalau update file
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;
const OFFLINE_URL = 'offline.html';

const PRECACHE_URLS = [
  'index.html',
  'dashboard.html',
  'css/style.css',
  'js/script.js',
  'js/login.js',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'images/bg-mobile.webp',
  'images/bg-desktop.webp',
  OFFLINE_URL
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Installing version:', CACHE_VERSION);
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Precaching failed:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key.startsWith(APP_NAME)) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
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
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'SI-JaNi Update', {
      body: data.body || 'Ada update terbaru!',
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-72x72.png',
      data: { url: data.url || 'index.html' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsArr => {
      for (const client of clientsArr) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url);
    })
  );
});