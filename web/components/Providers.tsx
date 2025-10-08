'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { setupAutoSync } from '@/lib/sync';

export function Providers({ children }: { children: React.ReactNode }) {
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    // Service Workerの登録
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Service Workerの更新チェック
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 新しいService Workerが利用可能
                  if (confirm('新しいバージョンが利用可能です。ページを更新しますか？')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // オンライン/オフライン検知
    const handleOnline = () => {
      setShowOfflineNotice(false);
    };

    const handleOffline = () => {
      setShowOfflineNotice(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // バックグラウンド同期のセットアップ
    const cleanupSync = setupAutoSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (cleanupSync) cleanupSync();
    };
  }, []);

  return (
    <SessionProvider>
      {children}
      <Toaster position="top-center" />

      {/* オフライン通知バナー */}
      {showOfflineNotice && (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4">
          <div className="bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-lg p-4 shadow-xl max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[var(--color-error-text)] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-error-text)]">
                  オフラインモード
                </p>
                <p className="text-xs text-[var(--color-neutral-700)] mt-0.5 text-justify">
                  一部の機能は利用できません。記録したデータは次回オンライン時に同期されます。
                </p>
              </div>
              <button
                onClick={() => setShowOfflineNotice(false)}
                className="text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </SessionProvider>
  );
}
