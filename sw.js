// sw.js - 먹통 화면 강제 초기화 및 실시간 연결 코드
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((c) => c.navigate(c.url.split('?')[0] + '?v=' + Date.now()));
      })
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request)));
});
