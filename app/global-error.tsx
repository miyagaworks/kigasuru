'use client';

/**
 * Global error boundary - catches all unhandled errors in the app
 * Displays user-friendly Japanese error messages
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[Global Error]', error);

  // Detect if this is a chunk loading error (offline issue)
  const isChunkLoadError = error.message?.includes('Loading chunk') ||
                          error.message?.includes('ChunkLoadError') ||
                          error.name === 'ChunkLoadError';

  return (
    <html lang="ja">
      <body>
        <div style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          textAlign: 'center',
          padding: '50px 20px',
          background: '#f5f5dc',
          minHeight: '100vh',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            background: 'white',
            padding: '40px 20px',
            borderRadius: '16px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
          }}>
            <h1 style={{
              color: '#286300',
              marginBottom: '16px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {isChunkLoadError ? '📡 オフラインです' : '⚠️ エラーが発生しました'}
            </h1>

            <p style={{
              color: '#666',
              lineHeight: '1.6',
              marginBottom: '16px',
              fontSize: '16px'
            }}>
              {isChunkLoadError
                ? 'このページはまだキャッシュされていません。'
                : 'アプリケーションでエラーが発生しました。'
              }
            </p>

            {isChunkLoadError && (
              <p style={{
                color: '#666',
                lineHeight: '1.6',
                marginBottom: '24px',
                fontSize: '14px'
              }}>
                オンラインに接続して、一度アクセスすると次回からオフラインでも利用できるようになります。
              </p>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => reset()}
                style={{
                  background: '#286300',
                  color: 'white',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                再試行
              </button>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  background: '#286300',
                  color: 'white',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ホームに戻る
              </button>
            </div>

            {isChunkLoadError && (
              <div style={{
                marginTop: '32px',
                padding: '16px',
                background: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107',
              }}>
                <p style={{
                  color: '#856404',
                  fontSize: '13px',
                  margin: 0,
                  lineHeight: '1.5',
                  textAlign: 'left'
                }}>
                  💡 <strong>ヒント:</strong> PWA（ホーム画面に追加したアプリ）を初めてインストールした直後は、オンライン状態で一度すべてのページ（記録、分析、設定、履歴）にアクセスしてください。その後はオフラインでも利用できます。
                </p>
              </div>
            )}

            {!isChunkLoadError && (
              <div style={{
                marginTop: '24px',
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'left',
                wordBreak: 'break-word',
              }}>
                <strong>エラー詳細:</strong><br/>
                {error.message}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
