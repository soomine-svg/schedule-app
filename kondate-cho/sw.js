// Prep Service Worker - v3 (network-first strategy)
const CACHE_NAME = 'prep-v3';
const FALLBACK_URLS = [
  './',
  './index.html',
  './manifest.json',
  './tab-recipes.svg',
  './tab-stock.svg',
  './tab-suggest.svg',
  './tab-shopping.svg',
  './tab-settings.svg',
  './icon-192.png',
  './icon-512.png',
];

// インストール時：基本ファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FALLBACK_URLS))
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ時：ネットワーク優先、失敗時のみキャッシュ使用
self.addEventListener('fetch', event => {
  // API呼び出しはキャッシュしない（ネットワーク直行）
  if (event.request.url.includes('api.anthropic.com')) return;

  // GETリクエストのみ対象
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 成功時：レスポンスをキャッシュに保存（フォールバック用）
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // ネットワーク失敗時：キャッシュから返す（オフライン対応）
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
