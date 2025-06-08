const APP_NAME = 'SI-JaNi';
const CACHE_NAME = `${APP_NAME}-v2.0.1`; // Versi diupdate untuk cache refresh
const OFFLINE_URL = '/SI-JaNi/offline.html'; // Halaman fallback

// Daftar resource yang akan di-cache
const urlsToCache = [
  '/SI-JaNi/',
  '/SI-JaNi/index.html',
  '/SI-JaNi/css/style.css',
  '/SI-JaNi/js/script.js',
  '/SI-JaNi/js/login.js',
  '/SI-JaNi/manifest.json',
  '/SI-JaNi/icons/icon-192x192.png',
  '/SI-JaNi/icons/icon-512x512.png',
  OFFLINE_URL
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.error('Failed to cache:', error);
          });
      })
      .then(() => self.skipWaiting()) // Memaksa aktivasi SW baru
  );
});

// Fetch Handler dengan strategi Cache First dengan fallback network
self.addEventListener('fetch', event => {
  // Skip permintaan non-GET dan cross-origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 1. Return cached response jika ada
        if (cachedResponse) {
          return cachedResponse;
        }

        // 2. Lakukan fetch untuk permintaan baru
        return fetch(event.request)
          .then(response => {
            // Validasi response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response untuk disimpan di cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(async () => {
            // 3. Fallback untuk halaman offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            
            // Fallback untuk gambar
            if (event.request.headers.get('accept').includes('image')) {
              return caches.match('/SI-JaNi/icons/icon-512x512.png');
            }
          });
      })
  );
});

// Cleanup cache lama saat aktivasi
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith(APP_NAME)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Mengontrol klien segera
  );
});
