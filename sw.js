
const CACHE_NAME = 'country-guesser-v1';
// Only cache local app shell files during installation.
// External resources will be cached on-demand by the fetch handler.
const URLS_TO_CACHE = [
  './',
  './index.html',
  './images/favicon.ico',
  './images/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategy: Cache first, then network. Update cache on network success.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Check if the response is valid to cache.
        // For same-origin requests, check for status 200.
        // For cross-origin (opaque) requests, we can't check status, but we can still cache them.
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
        // This catch is important for when the user is offline and the resource is not in cache.
        console.warn('Service Worker fetch failed:', event.request.url, err);
        // We could return a fallback response here if we wanted.
        // For now, re-throwing the error will result in a browser network error page if not cached.
        throw err;
      });

      // Return cached response if available, otherwise wait for the network.
      return cachedResponse || fetchPromise;
    })
  );
});


self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
