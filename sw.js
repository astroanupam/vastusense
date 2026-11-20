// Offline cache. Bump VERSION whenever any file changes.
const VERSION = 'vastusense-48';
const FILES = ['./','index.html','app.css','data.js','i18n.js','map.js','app.js','manifest.webmanifest','icon.svg','icon-maskable.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Only answer same-origin GET requests; never touch anything else.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  // Network first so a new upload shows at once; the cache answers only when offline.
  e.respondWith(fetch(e.request).then(r => { if (r && r.ok) { const c = r.clone(); caches.open(VERSION).then(k => k.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});












