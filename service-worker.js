// Cache-first service worker
const CACHE = 'sr-letterboard-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest'
];
self.addEventListener('install', evt=>{
  self.skipWaiting();
  evt.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', evt=>{
  evt.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => { if(k !== CACHE) return caches.delete(k); }));
    self.clients.claim();
  })());
});
self.addEventListener('fetch', evt=>{
  if(evt.request.method !== 'GET') return;
  evt.respondWith((async()=>{
    const cache = await caches.open(CACHE);
    const cached = await cache.match(evt.request);
    if(cached) return cached;
    try{
      const res = await fetch(evt.request);
      const url = new URL(evt.request.url);
      if(res.ok && url.origin === location.origin){
        cache.put(evt.request, res.clone());
      }
      return res;
    }catch(e){
      if(evt.request.mode === 'navigate'){
        return cache.match('./index.html');
      }
      throw e;
    }
  })());
});
