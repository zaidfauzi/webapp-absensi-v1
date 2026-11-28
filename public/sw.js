const CACHE = 'sdit-absensi-v2'
self.addEventListener('install', (e) => { self.skipWaiting() })
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})
self.addEventListener('fetch', (e) => {
  // Network-only: jangan cache, hindari data stale
  e.respondWith(fetch(e.request))
})