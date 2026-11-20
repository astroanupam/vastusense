// Offline cache. Bump VERSION whenever any file changes.
const VERSION = 'vastusense-33';
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
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
