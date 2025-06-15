const CACHE_NAME = 'si-jani-v2';
const OFFLINE_URL = 'offline.html';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/style.css',
    '/js/script.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Fetch Event with Network Falling Back to Cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response for caching
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => cache.put(event.request, responseToCache));
                return response;
            })
            .catch(() => {
                // If network fails, return from cache
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        // For HTML pages, return offline page if not cached
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match(OFFLINE_URL);
                        }
                        return cachedResponse;
                    });
            })
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    console.log('Service Worker activated');
});