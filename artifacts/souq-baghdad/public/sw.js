const CACHE_NAME = 'souqbaghdad-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo-128.webp',
  '/logo-256.webp',
  '/logo-512.webp',
  '/logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(async () => {
      const cached = await caches.match(e.request);
      if (cached) return cached;
      // Return a basic 503 response if offline and not in cache
      return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});
