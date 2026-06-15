const CACHE_VERSION = 'v8';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// プリキャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/assets/images/login.png',
  '/logo_top.svg',
  // UIアイコン
  '/assets/icons/ui/ui-delete.svg',
  '/assets/icons/ui/ui-settings.svg',
  '/assets/icons/ui/ui-close.svg',
  '/assets/icons/ui/ui-home.svg',
  '/assets/icons/ui/ui-menu.svg',
  '/assets/icons/ui/ui-check.svg',
  '/assets/icons/ui/ui-calendar.svg',
  '/assets/icons/ui/ui-record.svg',
  '/assets/icons/ui/ui-next.svg',
  '/assets/icons/ui/ui-edit.svg',
  '/assets/icons/ui/ui-analysis.svg',
  '/assets/icons/ui/ui-save.svg',
  '/assets/icons/ui/ui-back.svg',
  '/assets/icons/ui/ui-user.svg',
  // よく使用されるアイコン
  '/assets/icons/slope/slope-toe-down.svg',
  '/assets/icons/slope/slope-toe-up.svg',
  '/assets/icons/slope/slope-left-down.svg',
  '/assets/icons/slope/slope-left-up.svg',
  '/assets/icons/gyro/gyro-detect.svg',
  '/assets/icons/gyro/gyro-success.svg',
  '/assets/icons/gyro/gyro-error.svg',
  '/assets/icons/gyro/gyro-calibrate.svg',
  '/assets/icons/gyro/gyro-manual.svg',
  // Feeling アイコン
  '/assets/icons/feeling/feeling-great.svg',
  '/assets/icons/feeling/feeling-confident.svg',
  '/assets/icons/feeling/feeling-normal.svg',
  '/assets/icons/feeling/feeling-unsure.svg',
  '/assets/icons/feeling/feeling-bad.svg',
  // Lie アイコン
  '/assets/icons/lie/lie-a-grade.svg',
  '/assets/icons/lie/lie-b-grade.svg',
  '/assets/icons/lie/lie-c-grade.svg',
  '/assets/icons/lie/lie-bunker.svg',
  '/assets/icons/lie/lie-buried.svg',
  '/assets/icons/lie/lie-bad.svg',
  // Strength アイコン
  '/assets/icons/strength/strength-full.svg',
  '/assets/icons/strength/strength-normal.svg',
  '/assets/icons/strength/strength-soft.svg',
  // Wind アイコン
  '/assets/icons/wind/wind-strong.svg',
  '/assets/icons/wind/wind-weak.svg',
  '/assets/icons/wind/wind-arrow.svg',
  '/assets/icons/wind/wind-strong-white.svg',
  '/assets/icons/wind/wind-weak-white.svg',
  '/assets/icons/wind/wind-arrow-white.svg',
  // Weather アイコン
  '/assets/icons/weather/weather-summer.svg',
  '/assets/icons/weather/weather-mid.svg',
  '/assets/icons/weather/weather-winter.svg',
  // Result アイコン
  '/assets/icons/result/result-target.svg',
  '/assets/icons/result/result-just.svg',
  '/assets/icons/result/result-short.svg',
  '/assets/icons/result/result-over.svg',
  '/assets/icons/result/result-big-short.svg',
  '/assets/icons/result/result-big-over.svg',
  // Preset アイコン
  '/assets/icons/preset/preset-add.svg',
  '/assets/icons/preset/preset-delete.svg',
  '/assets/icons/preset/preset-favorite.svg',
  '/assets/icons/preset/preset-recent.svg',
];

// インストール時：静的アセットをプリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// フェッチ時：キャッシュ戦略を適用
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 外部リソース（Google、Stripe等）はキャッシュしない
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // API リクエスト：Network First戦略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // GETリクエストのみキャッシュに保存（POSTなどは除外）
          if (request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時の処理
          if (request.method === 'POST') {
            // POSTリクエストはオフラインではエラーを返す
            // （クライアント側でIndexedDBに保存する）
            return new Response(
              JSON.stringify({
                error: 'オフラインです。データはローカルに保存されます。',
                offline: true
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
          // GETリクエストはキャッシュから取得を試みる
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(
              JSON.stringify({ error: 'オフラインです' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // SVGアイコン：Cache First戦略（URLパターンで判定）
  if (url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((response) => {
            // 成功したレスポンスのみキャッシュ
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // オフライン時のフォールバック（空のSVGを返す）
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"></svg>',
              {
                headers: { 'Content-Type': 'image/svg+xml' },
              }
            );
          });
      })
    );
    return;
  }

  // 静的リソース（画像、CSS、JS等）：Cache First戦略
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((response) => {
            // 成功したレスポンスのみキャッシュ
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch((error) => {
            // オフライン時：スクリプトが読み込めない場合はエラーをスロー
            // これによりNext.jsがエラーを検知してフォールバックできる
            console.error('[SW] Failed to fetch resource:', url.pathname, error);
            return new Response('', {
              status: 408,
              statusText: 'Request Timeout',
            });
          });
      })
    );
    return;
  }

  // ナビゲーションリクエスト（ページ遷移）：Network First + Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // リダイレクトを含むレスポンスや認証が必要なレスポンスはキャッシュしない
          if (response.type === 'opaqueredirect' || response.redirected || response.status === 302 || response.status === 301) {
            return response;
          }

          // 成功したレスポンスのみキャッシュ
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時：キャッシュされたページのみ返す
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving cached page:', url.pathname);
              return cachedResponse;
            }

            // キャッシュになければオフラインページを表示
            console.log('[SW] Page not cached, showing offline page:', url.pathname);
            return caches.match(OFFLINE_URL).then((offlinePage) => {
              return offlinePage || new Response(
                `
                <!DOCTYPE html>
                <html lang="ja">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>オフライン</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                      text-align: center;
                      padding: 50px 20px;
                      background: #f5f5dc;
                      margin: 0;
                    }
                    .container {
                      max-width: 500px;
                      margin: 0 auto;
                      background: white;
                      padding: 40px 20px;
                      border-radius: 16px;
                      box-shadow: 0 2px 16px rgba(0,0,0,0.1);
                    }
                    h1 { color: #286300; margin-bottom: 16px; }
                    p { color: #666; line-height: 1.6; margin-bottom: 24px; }
                    button {
                      background: #286300;
                      color: white;
                      border: none;
                      padding: 12px 32px;
                      border-radius: 8px;
                      font-size: 16px;
                      cursor: pointer;
                      margin: 8px;
                      font-weight: bold;
                    }
                    button:active { background: #1f4d00; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>📡 オフラインです</h1>
                    <p>このページはまだキャッシュされていません。<br>オンラインに接続してから再度アクセスしてください。</p>
                    <button onclick="window.location.reload()">再読み込み</button>
                    <button onclick="window.location.href='/'">ホームに戻る</button>
                  </div>
                </body>
                </html>
                `,
                {
                  status: 200,
                  headers: { 'Content-Type': 'text/html; charset=utf-8' },
                }
              );
            });
          });
        })
    );
    return;
  }

  // その他のリクエスト：Network First戦略
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
