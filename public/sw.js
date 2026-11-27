/* El-Kīmiyā offline app-shell cache. Educational content is local/browser-only.
   This does NOT cache cloud AI or enable Gemini Nano on unsupported browsers. */
const CACHE_NAME = 'el-kimiya-app-shell-v85';
const CACHEABLE_ORIGINS = new Set([self.location.origin]);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['/', '/index.html', '/manifest.webmanifest', '/brand/favicon-192.png'].map(path => new Request(path, {cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME && key.startsWith('el-kimiya-')).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(!CACHEABLE_ORIGINS.has(url.origin)) return;
  if(url.pathname.startsWith('/api/') || url.pathname.includes('firebase')) return;
  if(request.mode === 'navigate') {
    event.respondWith(fetch(request, {cache:'no-store'}).then(response => {
      if(response.ok) { const copy=response.clone(); void caches.open(CACHE_NAME).then(cache=>cache.put('/index.html',copy)); }
      return response;
    }).catch(async()=> (await caches.match('/index.html')) || Response.error()));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if(response.ok && ['script','style','image','font','manifest'].includes(request.destination)) {
      const copy=response.clone();void caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));
    }
    return response;
  })));
});
