// Phase 139: Service worker version bump for feature release
const CACHE     = 'plant-zone-v134';
const API_CACHE = 'pzf-api-v1'; // separate; survives app-code updates

const CORE = [
  '/garden-zones/',
  '/garden-zones/index.html',
  '/garden-zones/app.js',
  '/garden-zones/data/constants.js',
  '/garden-zones/data/config.js',
  '/garden-zones/data/content.js',
  '/garden-zones/utils/index.js',
  '/garden-zones/features/recipes.js',
  '/garden-zones/styles.css',
  '/garden-zones/manifest.json',
  '/garden-zones/lib/leaflet.min.js',
  '/garden-zones/lib/leaflet.css',
  '/garden-zones/lib/turf.min.js',
  '/garden-zones/data/zones.geojson',
  '/garden-zones/data/planting.json',
  '/garden-zones/data/crops.json',
  '/garden-zones/data/ca_zones.geojson',
  '/garden-zones/data/au_zones.geojson',
  '/garden-zones/data/uk_zones.geojson',
  '/garden-zones/data/nz_zones.geojson',
  '/garden-zones/data/gardenate_ca.json',
  '/garden-zones/data/gardenate_au.json',
  '/garden-zones/data/gardenate_uk.json',
  '/garden-zones/data/gardenate_nz.json',
  '/garden-zones/features/weather.js',
  '/garden-zones/utils/storage.js',
  '/garden-zones/data/winter-bg.svg',
  '/garden-zones/data/spring-bg.svg',
  '/garden-zones/data/summer-bg.svg',
  '/garden-zones/data/autumn-bg.svg',
  '/garden-zones/icons/icon-192.png',
  '/garden-zones/icons/icon-512.png',
  '/garden-zones/icons/icon-192-maskable.png',
  '/garden-zones/icons/icon-512-maskable.png',
  '/garden-zones/icons/favicon.ico',
];

// Hosts whose responses we cache for offline fallback
const API_HOSTS = ['api.open-meteo.com', 'nominatim.openstreetmap.org'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      // Keep API_CACHE across updates so offline weather data persists
      Promise.all(keys.filter(k => k !== CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
  // Tell all open tabs that a new version is active
  self.clients.matchAll({ type: 'window' }).then(clients =>
    clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', cache: CACHE }))
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // ── External API calls: network-first, stale cache for offline ──
  if (API_HOSTS.includes(url.hostname)) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(API_CACHE).then(c => c.put(e.request, clone)); }
        return res;
      }).catch(async () => {
        const cached = await caches.match(e.request);
        return cached || new Response(null, { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // ── Same-origin assets: cache-first, network fallback ────────────
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
          return res;
        }).catch(async () => {
          // Navigation fallback: serve cached shell
          if (e.request.mode === 'navigate') {
            return caches.match('/garden-zones/') ||
                   caches.match('/garden-zones/index.html');
          }
        });
      })
    );
  }
});
