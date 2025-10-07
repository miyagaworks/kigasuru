'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

interface PwaInstallBannerProps {
  needsAdditionalAuth?: boolean;
}

export function PwaInstallBanner({ needsAdditionalAuth = false }: PwaInstallBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkInstallability = () => {
      // PWAかどうかチェック
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);

      // iOSかどうかチェック
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(iOS);

      // PWAではない場合のみバナーを表示
      if (!isPWA) {
        setShowBanner(true);
      }
    };

    checkInstallability();

    // インストールプロンプトイベントをキャッチ
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowBanner(false);
      }

      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // 30日間非表示にする
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  // バナーが非表示設定されている場合はチェック
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-banner-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 30) {
        setShowBanner(false);
      }
    }
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-50 animate-slide-up">
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="閉じる"
        >
          <Icon icon="x" className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
              <Icon icon="download" className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              キガスルをアプリとして使いましょう！
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ホーム画面に追加すると、アプリのようにすぐにアクセスできます。
              {needsAdditionalAuth && (
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  {' '}PWAを利用するには、アカウント設定で追加の認証方法を設定してください。
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            {needsAdditionalAuth ? (
              <Button
                onClick={() => window.location.href = '/account'}
                variant="primary"
                size="sm"
              >
                認証設定へ
              </Button>
            ) : (
              <Button
                onClick={handleInstallClick}
                variant="primary"
                size="sm"
              >
                インストール
              </Button>
            )}
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
            >
              後で
            </Button>
          </div>
        </div>

        {/* iOS向けインストール手順 */}
        {showInstructions && isIOS && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              iOSでのインストール方法
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>Safariブラウザで開いてください</li>
              <li>
                画面下部の共有ボタン
                <svg className="inline-block w-4 h-4 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                をタップ
              </li>
              <li>「ホーム画面に追加」をタップ</li>
              <li>「追加」をタップして完了</li>
            </ol>
            <Button
              onClick={() => setShowInstructions(false)}
              variant="link"
              size="sm"
              className="mt-2"
            >
              閉じる
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}