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
  const [showVideo, setShowVideo] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    const checkInstallability = () => {
      // PWAかどうかチェック
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);

      // iOSかどうかチェック
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      console.log('[PWA Banner] User Agent:', navigator.userAgent);
      console.log('[PWA Banner] iOS detected:', iOS);
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
              <p className="text-sm text-blue-100 text-justify mt-1">
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
          <div className="mt-4 p-4 bg-blue-50 rounded-t-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">
                iOSでのインストール方法
              </h4>
              <button
                onClick={() => setShowVideo(true)}
                className="flex-shrink-0 w-10 h-10 bg-[var(--color-secondary-blue)] hover:opacity-90 rounded-full flex items-center justify-center transition-colors mr-2 mt-2"
                aria-label="インストール方法の動画を見る"
              >
                <svg
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-white"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Safariブラウザで開いてください</li>
              <li>
                画面下部の共有ボタン
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/icons/preset/home_iphone.svg"
                  alt="共有"
                  className="inline-block w-5 h-5 mx-1"
                />
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

      {/* 動画モーダル */}
      {showVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"
          onClick={() => setShowVideo(false)}
        >
          <div
            className="relative bg-white w-full max-w-2xl mx-4 rounded-t-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-10 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="閉じる"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="p-4">
              <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
                インストール方法
              </h3>
              <div className="relative">
                <video
                  controls
                  autoPlay
                  className="w-full"
                  src="/assets/images/pwa.mp4"
                  onEnded={() => {
                    console.log('[PWA Banner] Video ended');
                    setVideoEnded(true);
                  }}
                  onPlay={() => console.log('[PWA Banner] Video playing')}
                  onLoadedData={() => console.log('[PWA Banner] Video loaded')}
                >
                  お使いのブラウザは動画タグに対応していません。
                </video>
                {videoEnded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <button
                      onClick={() => {
                        setShowVideo(false);
                        setVideoEnded(false);
                      }}
                      className="px-8 py-3 bg-[var(--color-secondary-blue)] text-white text-lg font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg"
                    >
                      閉じる
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}