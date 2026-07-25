const CACHE_NAME = 'souqbaghdad-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo-128.webp',
  '/logo-256.webp',
  '/logo-512.webp',
  '/logo.png',
  '/logo.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // 1. Ignore non-GET requests (POST, PUT, DELETE)
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // 2. Do not intercept Supabase Auth & REST API requests
  if (url.hostname.includes('supabase.co') && !url.pathname.includes('/storage/v1/object/public')) {
    return;
  }

  // 3. Handle Image Requests
  const isImage = e.request.destination === 'image' || 
                  url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i) ||
                  url.pathname.includes('/storage/v1/object/public');

  if (isImage) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache)).catch(() => {});
          }
          return networkResponse;
        }).catch(() => {
          // If network fetch fails for image in PWA, return clean SVG image fallback instead of text 503
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#0f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">سوق بغداد 🛍️</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        });
      })
    );
    return;
  }

  // 4. Standard Static Assets & Pages
  e.respondWith(
    fetch(e.request).then((response) => {
      if (response && response.status === 200 && response.type === 'basic' && url.origin === location.origin) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache)).catch(() => {});
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(e.request);
      if (cached) return cached;
      if (e.request.mode === 'navigate') {
        const indexCached = await caches.match('/index.html');
        if (indexCached) return indexCached;
      }
      return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});
