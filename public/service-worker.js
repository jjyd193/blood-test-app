const CACHE_NAME = 'blood-test-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
    const copy = res.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return res;
  }).catch(() => cached)));
});
