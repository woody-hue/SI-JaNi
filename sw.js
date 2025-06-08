const APP_NAME = 'SI-JaNi';
const CACHE_VERSION = 'v2.1.0';
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;
const OFFLINE_URL = '/SI-JaNi/offline.html';
const PRECACHE_URLS = [
  '/SI-JaNi/',
  '/SI-JaNi/index.html',
  '/SI-JaNi/css/style.css',
  '/SI-JaNi/js/script.js',
  '/SI-JaNi/js/login.js',
  '/SI-JaNi/manifest.json',
  '/SI-JaNi/icons/icon-192x192.png',
  '/SI-JaNi/icons/icon-512x512.png',
  '/SI-JaNi/images/bg-mobile.webp',
  '/SI-JaNi/images/bg-desktop.webp',
  OFFLINE_URL
];

// Installation - Precaches app shell and critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Installing new version:', CACHE_VERSION);
        return cache.addAll(PRECACHE_URLS)
          .then(() => console.log('[SW] Precaching complete'))
          .catch(err => console.error('[SW] Precaching failed:', err));
      })
      .then(() => self.skipWaiting())
  );
});

// Activation - Clean up old caches
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
    })
    .then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch - Cache with Network Fallback strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle navigation requests specially
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('[SW] Caching new response:', event.request.url);
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('[SW] Fetch failed:', error);
            // Special handling for images
            if (event.request.headers.get('accept').includes('image')) {
              return caches.match('/SI-JaNi/icons/icon-512x512.png');
            }
            // Return offline page for document requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
    // Implement your background sync logic here
  }
});
