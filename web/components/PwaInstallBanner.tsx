'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallBannerProps {
  needsAdditionalAuth?: boolean;
}

export function PwaInstallBanner({ needsAdditionalAuth = false }: PwaInstallBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkInstallability = () => {
      // PWAかどうかチェック
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);

      // iOSかどうかチェック
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(iOS);

      // モバイルかどうかチェック
      setIsMobile(window.innerWidth < 768);

      // PWAではない場合のみバナーを表示
      if (!isPWA) {
        setShowBanner(true);
      }
    };

    checkInstallability();

    // ウィンドウリサイズ時にモバイル判定を更新
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    // インストールプロンプトイベントをキャッチ
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('resize', handleResize);
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
    <div
      className="fixed bottom-0 left-0 right-0 shadow-lg z-50"
      style={{
        backgroundImage: "url(/assets/images/sky.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <div className="relative">
        <div className="max-w-4xl mx-auto p-4">
          <button
            onClick={handleDismiss}
            className="absolute z-50"
            style={{
              top: '12px',
              right: isMobile ? '12px' : '32px',
              width: '30px',
              height: '30px',
              minWidth: '30px',
              minHeight: '30px',
              maxWidth: '30px',
              maxHeight: '30px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              padding: '0',
              cursor: 'pointer',
            }}
            aria-label="閉じる"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: '#4B5563' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex flex-col md:flex-row items-center mt-4 gap-4">
            <div className="flex-shrink-0">
              <Image
                src="/assets/images/app_icon.png"
                alt="アプリアイコン"
                width={96}
                height={96}
                className="w-24 h-24"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-white">
                アプリとして使いましょう！
              </h3>
              <p className="text-sm text-blue-100 mt-1 text-justify">
                ホーム画面に追加すると、アプリのようにすぐにアクセスできます。
                {needsAdditionalAuth && (
                  <span className="text-orange-600 font-medium">
                    {" "}
                    PWAを利用するには、アカウント設定で追加の認証方法を設定してください。
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-3 mb-4">
              {needsAdditionalAuth ? (
                <button
                  onClick={() => (window.location.href = "/account")}
                  className="px-6 py-2 bg-[var(--color-primary-green)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  認証設定へ
                </button>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="px-6 py-2 bg-[var(--color-secondary-blue)] text-white border-2 border-white rounded-lg hover:bg-blue-950 transition-colors"
                >
                  インストール
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-6 py-2 border-2 border-[var(--color-secondary-blue)] text-[var(--color-secondary-blue)] bg-[var(--color-bg-main)] rounded-lg hover:bg-[var(--color-neutral-200)] transition-colors"
              >
                後で
              </button>
            </div>
          </div>
        </div>
        {/* iOS向けインストール手順 */}
        {showInstructions && isIOS && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              iOSでのインストール方法
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Safariブラウザで開いてください</li>
              <li>
                画面下部の共有ボタン
                <svg
                  className="inline-block w-4 h-4 mx-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                をタップ
              </li>
              <li>「ホーム画面に追加」をタップ</li>
              <li>「追加」をタップして完了</li>
            </ol>
            <button
              onClick={() => setShowInstructions(false)}
              className="mt-2 text-blue-600 text-sm underline hover:no-underline"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}