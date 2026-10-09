/* All Property Link service worker — Lane B (offline only).
 * Root scope: /sw.js controls origin root (/).
 * Strategies:
 * - /api/* + https://api.allpropertylink.co.ke/* : network-first, fallback to cache.
 *   Never cache non-GET (POST/PUT/DELETE/PATCH) and never cache auth refresh.
 * - GET navigations / pages / images (same-origin): stale-while-revalidate,
 *   navigation fallback to /offline on total failure.
 * No workbox / next-pwa. Same-origin only.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `apl-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `apl-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const API_ORIGIN = "https://api.allpropertylink.co.ke";
const AUTH_REFRESH_HINT = "/api/auth/refresh";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
              return caches.delete(key);
            }
            return undefined;
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isNonCacheableMethod(request) {
  return request.method !== "GET" && request.method !== "HEAD";
}

function isAuthRefresh(url) {
  return url.pathname.includes(AUTH_REFRESH_HINT);
}

function isApiRequest(url) {
  // Same-origin /api/* or absolute backend origin.
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    return true;
  }
  return url.href.startsWith(API_ORIGIN);
}

async function networkFirst(request, url) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    // Only cache successful same-origin GET API responses (never auth refresh).
    if (response && response.ok && !isAuthRefresh(url)) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // For navigations, fall back to the offline page.
    if (request.mode === "navigate") {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw error;
  }
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => undefined);
  // Return cache immediately; revalidate in background.
  if (cached) {
    event.waitUntil(networkPromise.catch(() => {}));
    return cached;
  }
  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;
  // Navigation fallback when both cache + network fail.
  if (request.mode === "navigate") {
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
  }
  return new Response("Offline", { status: 503, statusText: "Offline" });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Same-origin only — let the browser handle cross-origin (fonts, images CDN, etc.).
  if (url.origin !== self.location.origin && !url.href.startsWith(API_ORIGIN)) {
    return;
  }

  // Never intercept or cache mutations.
  if (isNonCacheableMethod(request)) {
    return;
  }

  // Never cache auth refresh — always go to network.
  if (isAuthRefresh(url)) {
    return;
  }

  // Do not aggressively cache the service worker itself — always network.
  if (url.pathname === "/sw.js") {
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, url));
    return;
  }

  // GET pages / images / static: stale-while-revalidate.
  if (request.method === "GET") {
    event.respondWith(staleWhileRevalidate(event));
  }
});
