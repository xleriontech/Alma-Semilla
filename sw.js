/* ==================================================================
   FUNDACIÓN ALMA Y SEMILLA · sw.js
   Service worker: sitio instalable y disponible sin conexión.
   ------------------------------------------------------------------
   Estrategias
   - Navegación (HTML): red primero, caché como respaldo y, si no hay
     red, la página sin conexión.
   - Assets estáticos con hash (?v=...): caché primero. Son
     inmutables, así que no hace falta volver a pedirlos.
   - Recursos externos (fuentes, imágenes): red primero con respaldo
     en caché (stale-while-revalidate).
   ================================================================== */

const VERSION = 'v1';
const CACHE_ESTATICO = 'almaysemilla-estatico-' + VERSION;
const CACHE_PAGINAS = 'almaysemilla-paginas-' + VERSION;
const CACHE_EXTERNO = 'almaysemilla-externo-' + VERSION;

const PRECACHE = [
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/img/logo.svg',
  '/assets/img/icon-192.png',
  '/assets/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_ESTATICO)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves
          .filter((k) => k.startsWith('almaysemilla-') && k !== CACHE_ESTATICO && k !== CACHE_PAGINAS && k !== CACHE_EXTERNO)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

function esNavegacion(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

function esAssetVersionado(url) {
  return url.origin === self.location.origin &&
    url.pathname.startsWith('/assets/') &&
    url.searchParams.has('v');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // --- Navegación: red primero ---
  if (esNavegacion(request)) {
    event.respondWith(
      fetch(request)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE_PAGINAS).then((cache) => cache.put(request, copia));
          return respuesta;
        })
        .catch(() => caches.match(request)
          .then((cacheada) => cacheada || caches.match('/offline.html'))
        )
    );
    return;
  }

  // --- Assets versionados: caché primero (son inmutables) ---
  if (esAssetVersionado(url)) {
    event.respondWith(
      caches.match(request).then((cacheada) => {
        if (cacheada) return cacheada;
        return fetch(request).then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE_ESTATICO).then((cache) => cache.put(request, copia));
          return respuesta;
        });
      })
    );
    return;
  }

  // --- Recursos externos: red primero con respaldo ---
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.open(CACHE_EXTERNO).then(async (cache) => {
        const cacheada = await cache.match(request);
        const red = fetch(request).then((respuesta) => {
          if (respuesta && (respuesta.ok || respuesta.type === 'opaque')) {
            cache.put(request, respuesta.clone());
          }
          return respuesta;
        }).catch(() => cacheada);
        return cacheada || red;
      })
    );
    return;
  }

  // --- Resto de recursos del mismo origen: caché primero ---
  event.respondWith(
    caches.match(request).then((cacheada) => {
      if (cacheada) return cacheada;
      return fetch(request).then((respuesta) => {
        if (respuesta && respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE_ESTATICO).then((cache) => cache.put(request, copia));
        }
        return respuesta;
      });
    })
  );
});
