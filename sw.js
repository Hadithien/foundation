const V = 'foundation-v9';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'calligraphy.js', 'manifest.webmanifest', 'icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone();
    caches.open(V).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});



