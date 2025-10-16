'use client';

interface BrowserInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceInfo: {
    isIOS: boolean;
    isAndroid: boolean;
    isLine: boolean;
  } | null;
}

/**
 * LINEアプリ内ブラウザから外部ブラウザで開く方法を案内するモーダル
 */
export function BrowserInstructionsModal({
  isOpen,
  onClose,
  deviceInfo
}: BrowserInstructionsModalProps) {
  if (!isOpen || !deviceInfo?.isLine) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-3">
            ブラウザで開いてください
          </h3>
          <p className="text-[var(--color-neutral-600)] mb-6">
            KIGASURUを利用するには、{deviceInfo.isIOS ? 'Safari' : 'Chrome'}で開く必要があります。
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl mb-6">
          <p className="text-sm font-bold text-[var(--color-neutral-900)] mb-2">
            開き方:
          </p>
          {deviceInfo.isIOS ? (
            <ol className="text-sm text-[var(--color-neutral-700)] space-y-2 list-decimal list-inside">
              <li>画面右上の「<strong>…</strong>」をタップ</li>
              <li>「<strong>Safariで開く</strong>」を選択</li>
            </ol>
          ) : (
            <ol className="text-sm text-[var(--color-neutral-700)] space-y-2 list-decimal list-inside">
              <li>画面右上の「<strong>⋮</strong>」をタップ</li>
              <li>「<strong>他のアプリで開く</strong>」を選択</li>
              <li>「<strong>Chrome</strong>」を選択</li>
            </ol>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[var(--color-neutral-200)] text-[var(--color-neutral-700)] font-bold rounded-xl hover:bg-[var(--color-neutral-300)] transition-all"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
