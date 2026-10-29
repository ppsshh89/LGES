const CACHE_NAME = 'smart-pay-v7.7';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  // 버전 변경 시 기존 캐시가 지워져도 즉시 오프라인 구동이 가능하도록 필수 파일 사전 확보
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, url.startsWith('http') ? { mode: 'no-cors' } : { cache: 'no-cache' })
            .then((res) => {
              if (res && (res.ok || res.type === 'opaque')) {
                return cache.put(url, res);
              }
            })
        )
      )
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // 깃허브 Gist 클라우드 백업/복원 API 요청은 캐싱하지 않고 실시간 통신 유지
  if (url.hostname.includes('api.github.com')) return;

  const isSameOrigin = url.origin === self.location.origin;

  e.respondWith(
    fetch(e.request, isSameOrigin ? { cache: 'no-store' } : undefined)
      .then((res) => {
        // 정상 응답(200) 또는 외부 CDN(opaque) 응답만 선별하여 캐시 갱신 (404 에러 등 캐싱 방지)
        if (res && (res.ok || res.type === 'opaque')) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => {
          if (cached) return cached;
          // 오프라인 상태에서 화면 접속 시 주소 끝이 '/'이거나 './index.html'일 때 교차 폴백 지원
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        })
      )
  );
});
