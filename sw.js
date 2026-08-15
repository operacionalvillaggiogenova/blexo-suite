const CACHE = 'blexo-check-medicoes-v3';
const ASSETS = ['./', './index.html', './styles.css', './observation-size.css', './photo-notes.css', './seals.css', './app.js', './document-scanner.html', './document-scanner.js', './document-scanner.css', './manifest.webmanifest', 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { const copy = response.clone(); if (event.request.method === 'GET') caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response; }))));
