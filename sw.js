const CACHE_NAME = 'ma-voiture-v1';
const ASSETS = [
  '/Ou-est-ma-voiture/index.html',
  '/Ou-est-ma-voiture/manifest.json',
  '/Ou-est-ma-voiture/icon-192.png',
  '/Ou-est-ma-voiture/icon-512.png'
];

// Installation : mise en cache des ressources statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch : cache-first pour les assets locaux, network-first pour les requêtes externes (OSRM, Nominatim)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Requêtes externes (APIs) : réseau uniquement, pas de cache
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Assets locaux : cache en priorité
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
