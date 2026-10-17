/* This template is completed after Next's static export. */
'use strict';
const VERSION = '__TROPHIES_CACHE_VERSION__';
const PREFIX = 'lab-trophies-v1-';
const CACHE = PREFIX + VERSION;
const PRECACHE = /* TROPHIES_PRECACHE */ [];
const ROUTES = /* TROPHIES_ROUTES */ {};
const ALLOWED = new Set(PRECACHE);
const sensitiveQuery = /^(?:code|token|access_token|refresh_token|error|error_description)$/i;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    if (!PRECACHE.length || VERSION.startsWith('__')) throw new Error('Unbuilt Trophy Tracker worker');
    // Cache the whole immutable release before it can become active. A failed
    // resource rejects installation and leaves the previous worker untouched.
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(PRECACHE.map(path => new Request(path, { cache: 'reload', credentials: 'same-origin' })));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
    // Updates wait for an explicit user action. No skipWaiting at install.
  })());
});

self.addEventListener('activate', event => {
  // Keep previous releases: a tab with an older document can still request its
  // hashed chunks after another tab chooses an update. Never delete other apps.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'TROPHIES_APPLY_UPDATE') return;
  const sourceUrl = event.source?.url;
  if (!sourceUrl) return;
  const source = new URL(sourceUrl);
  if (source.origin !== self.location.origin || !(source.pathname === '/trophies' || source.pathname === '/trophies.html' || source.pathname.startsWith('/trophies/'))) return;
  event.waitUntil(self.skipWaiting());
});

async function previousReleaseAsset(request) {
  const url = new URL(request.url);
  // Only exact static entries already cached by this app are eligible. Never
  // read arbitrary CacheStorage responses or old HTML/Flight route payloads.
  if (!url.pathname.startsWith('/_next/static/')) return undefined;
  for (const name of await caches.keys()) {
    if (name === CACHE || !name.startsWith(PREFIX)) continue;
    const response = await (await caches.open(name)).match(url.pathname);
    if (response) return response;
  }
  return undefined;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('authorization')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || [...url.searchParams.keys()].some(key => sensitiveQuery.test(key))) return;
  const shell = request.mode === 'navigate' ? ROUTES[url.pathname] : undefined;
  const path = shell || url.pathname;
  const isKnown = ALLOWED.has(path);
  if (!isKnown && !path.startsWith('/_next/static/')) return;
  event.respondWith((async () => {
    if (isKnown) {
      const response = await (await caches.open(CACHE)).match(path);
      if (response) return response;
    }
    const previous = await previousReleaseAsset(request);
    if (previous) return previous;
    // Runtime requests are never written to a cache. Auth, API calls and user
    // progress remain private to the existing auth client and IndexedDB store.
    return fetch(request);
  })());
});
