'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

interface SettingsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsGuideModal({ isOpen, onClose }: SettingsGuideModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSettingsClick = () => {
    router.push("/settings#input-settings");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--color-bg-main)] rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button - positioned absolute to the modal */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center bg-white hover:bg-gray-100 rounded-full transition-colors z-10"
          style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px', top: '16px', right: '16px' }}
          aria-label="閉じる"
        >
          <svg
            width="21"
            height="21"
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

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 pr-10">
            <Icon category="ui" name="settings" size={24} />
            <h2 className="text-xl font-bold text-[var(--color-info-text)]">
              まずは設定をしましょう
            </h2>
          </div>

          {/* Content */}
          <div className="space-y-4 text-justify">
            <div className="bg-[var(--color-error-border)] border border-[var(--color-secondary-red)] rounded-lg p-4">
              <p className="font-bold text-[var(--color-secondary-red)]">
                ⚠️ 正確な情報保存のため、以下の設定を必ず行ってください：
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4 mt-3">
                <li className="text-[var(--color-neutral-700)]">
                  <span className="font-bold">入力項目の選択</span>
                  <p className="text-sm text-[var(--color-neutral-900)] ml-6 mt-1">
                    あなたのゴルフレベルに合わせて、記録する項目をカスタマイズしてください。
                  </p>
                </li>
                <li className="text-[var(--color-neutral-700)]">
                  <span className="font-bold">クラブ設定</span>
                  <p className="text-sm text-[var(--color-neutral-900)] ml-6 mt-1">
                    お使いのクラブセッティングに合わせて調整してください。
                  </p>
                </li>
              </ol>
            </div>

            {/* Level comparison table */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-700">レベル別の入力項目例</h3>

              {/* Beginner */}
              <div className="bg-[var(--color-success-border)] border border-[var(--color-neutral-100)] rounded-lg p-3">
                <div className="font-bold text-[var(--color-primary-green)] mb-2 text-sm">
                  初心者
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[var(--color-primary-green)] text-white text-xs font-medium rounded-full">
                    傾斜
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-primary-green)] text-white text-xs font-medium rounded-full">
                    クラブ
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-primary-green)] text-white text-xs font-medium rounded-full">
                    結果
                  </span>
                </div>
              </div>

              {/* Intermediate */}
              <div className="bg-[var(--color-info-border)] border border-[var(--color-neutral-100)] rounded-lg p-3">
                <div className="font-bold text-[var(--color-secondary-blue)] mb-2 text-sm">
                  中級者
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[var(--color-secondary-blue)] text-white text-xs font-medium rounded-full">
                    傾斜
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-secondary-blue)] text-white text-xs font-medium rounded-full">
                    クラブ
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-secondary-blue)] text-white text-xs font-medium rounded-full">
                    ライ
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-secondary-blue)] text-white text-xs font-medium rounded-full">
                    強度
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-secondary-blue)] text-white text-xs font-medium rounded-full">
                    結果
                  </span>
                </div>
              </div>

              {/* Advanced */}
              <div className="bg-[var(--color-muted-border)] border border-[var(--color-neutral-100)] rounded-lg p-3">
                <div className="font-bold text-[var(--color-neutral-700)] mb-2 text-sm">
                  上級者
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full">
                    傾斜
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full">
                    クラブ
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full">
                    ライ
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full">
                    強度
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full">
                    風向き
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full">
                    気温
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full">
                    メモ
                  </span>
                  <span className="px-3 py-1 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full">
                    結果
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              ※ 設定を変更するまでこのメッセージは表示され続けます
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="primary"
              onClick={handleSettingsClick}
              className="flex-1 text-sm"
            >
              設定ページへ
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 text-sm"
            >
              後で設定
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}