/* MAKANAI service worker — ネットワーク優先・キャッシュはフォールバック。
   更新時は CACHE の版を上げること（v1 → v2 …）。*/
const CACHE = 'makanai-v10';
const ASSETS = [
  './', './index.html', './manifest.json',
  './favicon.png', './icon-180.png', './icon-192.png', './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Claude API はキャッシュしない
  if (e.request.url.indexOf('api.anthropic.com') !== -1) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
