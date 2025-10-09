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

        <p className="text-[var(--color-neutral-600)] mb-6">
          インターネット接続が利用できません。<br />
          ネットワークに接続してから再度お試しください。
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

        <div className="mt-6 p-4 bg-[var(--color-neutral-100)] rounded-lg">
          <p className="text-xs text-[var(--color-neutral-600)]">
            💡 オフライン時でも、一部の機能（ショット記録、データ閲覧）は利用可能です。<br />
            記録したデータは、次回オンライン時に自動で同期されます。
          </p>
        </div>
      </div>
    </div>
  );
}
