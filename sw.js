const CACHE='blexo-unificado-v21';
const ASSETS=['./','./index.html','./check.html','./leiturista.html','./scanner.html','./dashboard.css','./dashboard.js','./config.js','./styles.css','./observation-size.css','./photo-notes.css','./seals.css','./app.js','./check-app.js','./scanner.css','./scanner.js?v=21','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match('./index.html'))))});
