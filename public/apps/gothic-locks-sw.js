/* Scoped offline cache for Gothic Remake — Замки.
 * This template is completed by scripts/build-gothic-locks.mjs after next build.
 * It must not be registered on the Next development server.
 */
"use strict";
const CACHE_PREFIX = "gothic-locks-v1-";
const CACHE_VERSION = "__GOTHIC_CACHE_VERSION__";
const PRECACHE_URLS = /* GOTHIC_PRECACHE */ [];
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const APP_SHELL = "/apps/gothic-locks.html";
const APP_ROUTES = new Set(["/apps/gothic-locks", "/apps/gothic-locks/", APP_SHELL, "/apps/gothic-locks/index.html"]);
const PRECACHE_PATHS = new Set(PRECACHE_URLS);

self.addEventListener("install", (event) => {
  if (!PRECACHE_URLS.length) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // A missing asset prevents activating a partial app.
    await cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" })));
    // Updates wait for all clients of the previous version to close.
    // First installation activates automatically; never replace a running app's cache.
  })());
});
self.addEventListener("activate", (event) => {
  if (!PRECACHE_URLS.length) return;
  event.waitUntil((async () => {
    const openWindows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const hasAppWindows = openWindows.some((client) => client.url && APP_ROUTES.has(new URL(client.url).pathname));
    // Explicit activation can leave another tab running old HTML. Preserve its
    // hashed chunks until a later activation with no app windows can collect them.
    if (!hasAppWindows) {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    }
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) client.postMessage({ type: "GOTHIC_OFFLINE_READY" });
  })());
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!PRECACHE_URLS.length || request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate" && APP_ROUTES.has(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(APP_SHELL)) || fetch(request);
    })());
    return;
  }
  // Controlled documents can request shared chunks outside the document scope.
  // Only this app's explicit entries are served; other site pages pass through.
  if (!PRECACHE_PATHS.has(url.pathname)) {
    if (url.pathname.startsWith("/_next/static/")) event.respondWith((async () => {
      for (const name of await caches.keys()) {
        if (!name.startsWith(CACHE_PREFIX) || name === CACHE_NAME) continue;
        const cached = await (await caches.open(name)).match(url.pathname);
        if (cached) return cached;
      }
      return fetch(request);
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(url.pathname)) || fetch(request);
  })());
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "GOTHIC_APPLY_UPDATE") {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const resources = await Promise.all(PRECACHE_URLS.map((url) => cache.match(url)));
      // A user may request activation only after the full offline build exists.
      if (PRECACHE_URLS.length && resources.every(Boolean)) await self.skipWaiting();
    })());
  }
  if (event.data?.type === "GOTHIC_CHECK_OFFLINE" && event.ports[0]) {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const resources = await Promise.all(PRECACHE_URLS.map((url) => cache.match(url)));
      const ready = PRECACHE_URLS.length > 0 && resources.every(Boolean);
      event.ports[0].postMessage({ ready, version: CACHE_VERSION });
    })());
  }
});
