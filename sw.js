const CACHE_NAME = 'emergencia-radiologica-v1'; // Nombre único para esta app
const ASSETS = [
  './',
  './index.html'
];

// Instala y guarda el HTML en la memoria del celu
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Limpia cachés viejos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Sirve el archivo offline si no hay señal en el hospital
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request) || caches.match('./index.html');
    })
  );
});
