'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] px-4">
      <div className="max-w-md w-full bg-[var(--color-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--color-neutral-300)] text-center">
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-[var(--color-neutral-400)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-3">
          オフラインです
        </h1>

        <p className="text-[var(--color-neutral-600)] mb-2">
          このページはまだキャッシュされていません。
        </p>
        <p className="text-sm text-[var(--color-neutral-500)] mb-6">
          オンラインに接続して、一度アクセスすると次回からオフラインでも利用できるようになります。
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)] text-white"
          >
            再読み込み
          </Button>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full border-[var(--color-neutral-400)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]"
            >
              ホームに戻る
            </Button>
          </Link>
        </div>

        <div className="mt-6 p-4 bg-[var(--color-info-bg)] rounded-lg border border-[var(--color-info-border)]">
          <p className="text-xs text-[var(--color-info-text)] leading-relaxed">
            💡 <strong>ヒント：</strong>PWA（ホーム画面に追加したアプリ）を初めてインストールした直後は、オンライン状態で一度すべてのページ（記録、分析、設定、履歴）にアクセスしてください。その後はオフラインでも利用できます。
          </p>
        </div>
      </div>
    </div>
  );
}
