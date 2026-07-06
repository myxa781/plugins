/**
 * sw.js — Service Worker для Murglar Plugins PWA
 * Стратегия: Cache First для статики, Network First для данных
 */

'use strict';

const CACHE_NAME = 'murglar-plugins-v1';
const DATA_CACHE = 'murglar-data-v1';

// Статические ресурсы для прекэширования
const STATIC_ASSETS = [
  './',
  './index.html',
  './plugin.html',
  './about.html',
  './404.html',
  './css/material.css',
  './css/style.css',
  './css/responsive.css',
  './js/app.js',
  './js/plugin.js',
  './js/router.js',
  './js/gallery.js',
  './js/search.js',
  './js/theme.js',
  './js/utils.js',
  './assets/logo.svg',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
  './manifest.json',
];

// Данные (Network First)
const DATA_ASSETS = [
  './data/plugins.json',
];

/* ─── INSTALL ─── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache what we can, ignore individual failures
      await Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
      // Cache data
      const dataCache = await caches.open(DATA_CACHE);
      await Promise.allSettled(
        DATA_ASSETS.map(url => dataCache.add(url).catch(() => {}))
      );
      await self.skipWaiting();
    })()
  );
});

/* ─── ACTIVATE ─── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean old caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DATA_CACHE)
          .map(k => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/* ─── FETCH ─── */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET, cross-origin, and chrome-extension
  if (
    event.request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Data files: Network First
  if (url.pathname.includes('/data/')) {
    event.respondWith(networkFirst(event.request, DATA_CACHE));
    return;
  }

  // Plugin assets (APK/JAR): Network only, no caching
  if (
    url.pathname.endsWith('.apk') ||
    url.pathname.endsWith('.jar')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets: Cache First
  event.respondWith(cacheFirst(event.request, CACHE_NAME));
});

/* ─── STRATEGIES ─── */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cached404 = await caches.match('./404.html');
      if (cached404) return cached404;
    }
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/* ─── MESSAGE HANDLING ─── */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    );
  }
});
