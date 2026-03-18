const CACHE = 'plant-zone-v4';
const CORE = [
  '/garden-zones/',
  '/garden-zones/index.html',
  '/garden-zones/app.js',
  '/garden-zones/styles.css',
  '/garden-zones/manifest.json',
  '/garden-zones/lib/leaflet.min.js',
  '/garden-zones/lib/leaflet.css',
  '/garden-zones/lib/turf.min.js',
  '/garden-zones/data/zones.geojson',
  '/garden-zones/data/planting.json',
  '/garden-zones/data/crops.json',
  '/garden-zones/data/winter-bg.svg',
  '/garden-zones/data/spring-bg.svg',
  '/garden-zones/data/summer-bg.svg',
  '/garden-zones/data/autumn-bg.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for app assets, network-first for everything else
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
