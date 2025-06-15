const APP_NAME = 'SI-JaNi';
const CACHE_VERSION = 'v2.2.0'; // Updated version
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;
const OFFLINE_URL = '/SI-JaNi/offline.html';
const PRECACHE_URLS = [
  '/SI-JaNi/',
  '/SI-JaNi/index.html',
  '/SI-JaNi/css/style.css',
  '/SI-JaNi/js/script.js',
  '/SI-JaNi/manifest.json',
  '/SI-JaNi/icons/icon-192x192.png',
  '/SI-JaNi/icons/icon-512x512.png',
  '/SI-JaNi/images/bg-mobile.webp',
  '/SI-JaNi/images/bg-desktop.webp',
  OFFLINE_URL
];

// Enhanced install event with update notification capability
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Installing new version:', CACHE_VERSION);
        return cache.addAll(PRECACHE_URLS)
          .then(() => {
            console.log('[SW] Precaching complete');
            // Immediately activate the new SW
            return self.skipWaiting();
          })
          .catch(err => {
            console.error('[SW] Precaching failed:', err);
            throw err;
          });
      })
  );
});

// Improved activate event with client claiming
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
      // Send update notification to all controlled pages
      self.clients.matchAll({type: 'window'}).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: CACHE_VERSION
          });
        });
      });
      return self.clients.claim();
    })
  );
});

// Fetch handler with network-first strategy for API calls
self.addEventListener('fetch', event => {
  const {request} = event;
  
  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // API requests - Network first
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Cache successful API responses
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets - Cache first
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => cachedResponse || fetch(request))
  );
});

// Message handler for update notifications
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline capabilities
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(
      // Implement your sync logic here
      console.log('Data synced successfully')
    );
  }
});

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'SI-JaNi Update', {
      body: data.body || 'New content is available!',
      icon: '/SI-JaNi/icons/icon-192x192.png',
      badge: '/SI-JaNi/icons/icon-72x72.png',
      data: {
        url: data.url || '/SI-JaNi/'
      }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});
