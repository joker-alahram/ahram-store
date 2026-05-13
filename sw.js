const CACHE_NAME = 'ahram-co-shell-v3';
const SHELL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './assets/pwa/icon-192.png',
  './assets/pwa/icon-180.png',
  './assets/pwa/icon-512.png',
  './assets/pwa/icon-maskable-192.png',
  './assets/pwa/icon-maskable-512.png',
  './src/styles/tokens.css',
  './src/styles/base.css',
  './src/styles/layout.css',
  './src/styles/components.css',
  './src/styles/utilities.css',
  './src/styles/themes/premium-dark.css',
  './src/styles/themes/orange-theme.css',
  './src/styles/themes/sky-blue-theme.css',
  './src/styles/themes/white-theme.css',
  './src/styles/themes/green-yellow-theme.css',
  './src/styles/themes/amazon-inspired-theme.css',
  './src/styles/themes/vip-light-theme.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()));
    await self.clients.claim();
  })());
});

function isCacheable(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return ['document', 'style', 'script', 'image', 'font'].includes(request.destination) || url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg');
}

function isNetworkFirst(request) {
  const url = new URL(request.url);
  return request.destination === 'document'
    || request.destination === 'script'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('.js');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isCacheable(request)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });

    if (isNetworkFirst(request)) {
      try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        return cached;
      }
    }

    const network = fetch(request).then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    }).catch(() => cached);
    return cached || network;
  })());
});
