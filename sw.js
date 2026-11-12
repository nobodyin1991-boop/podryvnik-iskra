/* Подрывник Искра: offline support. The page itself is always fetched fresh when there is a network
   (so updates arrive at once) and served from the cache only when there is none. Fonts and icons never change, so they are cached. */
const CACHE = 'iskra-v1';
const SHELL = ['./', 'manifest.webmanifest', 'fonts/fonts.css', 'icons/icon-192.png',
  'fonts/DelaGothicOne-400-cyrillic.woff2', 'fonts/DelaGothicOne-400-latin.woff2',
  'fonts/GolosText-400-cyrillic.woff2', 'fonts/GolosText-400-latin.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.webmanifest');
  if (page) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./'))));
  } else {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })));
  }
});
