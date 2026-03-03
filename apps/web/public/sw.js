// Pompom Tama — Service Worker (offline cache)
const CACHE_NAME = 'pompom-v2';

const PRECACHE_URLS = [
    './',
    './index.html',
    './icons/icon-192.png',
    './icons/icon-512.png',
];

// Install: pre-cache shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first, fallback to cache
// En la primera visita todos los assets quedan cacheados automáticamente.
self.addEventListener('fetch', (event) => {
    // Solo cachear requests GET del mismo origen
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
