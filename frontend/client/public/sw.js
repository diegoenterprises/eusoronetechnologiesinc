/**
 * EUSOTRIP SERVICE WORKER (Tasks 3.3.1/3.3.2: PWA + Offline Mode)
 * ═══════════════════════════════════════════════════════════════
 * Strategy:
 *   - App Shell: Cache-first (HTML, CSS, JS, fonts, images)
 *   - API calls: Network-first with offline fallback
 *   - Static assets: Cache-first with background revalidation
 *   - Offline page: Served when network unavailable
 */

const CACHE_VERSION = 'eusotrip-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const OFFLINE_URL = '/offline.html';

// App shell — cached on install
const APP_SHELL = [
  '/',
  '/eusotrip-logo.png',
  '/esang-ai-logo.svg',
  '/manifest.json',
  '/offline.html',
];

// ── Install ─────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Some app shell assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate — clean old caches ─────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch strategy ──────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip WebSocket, chrome-extension, etc.
  if (!url.protocol.startsWith('http')) return;

  // API calls — network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Static assets (JS, CSS, images, fonts) — cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstWithNetwork(request));
    return;
  }

  // Navigation requests (HTML pages) — network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the page for offline use
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Default — network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── Helpers ──────────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$/i.test(pathname)
    || pathname.startsWith('/assets/');
}

async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(API_CACHE);
      cache.put(request, clone);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are offline. Data shown may be stale.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirstWithNetwork(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Background revalidation
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, response));
      }
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, clone);
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

// ── Background Sync (for offline mutations) ─────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-mutations') {
    event.waitUntil(syncOfflineMutations());
  }
});

async function syncOfflineMutations() {
  try {
    const cache = await caches.open('eusotrip-offline-queue');
    const requests = await cache.keys();
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        if (response) {
          const body = await response.text();
          await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: body || undefined,
          });
          await cache.delete(request);
        }
      } catch {
        console.warn('[SW] Failed to sync mutation, will retry:', request.url);
      }
    }
  } catch (err) {
    console.error('[SW] syncOfflineMutations error:', err);
  }
}

// ── Push Notifications ──────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from EusoTrip',
      icon: '/eusotrip-logo.png',
      badge: '/eusotrip-logo.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
      actions: data.actions || [],
      tag: data.tag || 'eusotrip-notification',
      renotify: true,
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'EusoTrip', options)
    );
  } catch {
    console.warn('[SW] Push parse error');
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
