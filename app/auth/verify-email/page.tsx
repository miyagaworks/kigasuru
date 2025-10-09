'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] px-4">
      <div className="max-w-md w-full bg-[var(--color-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--color-neutral-300)] text-center">
        {/* Mail Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-[var(--color-secondary-blue)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4">
          確認メールを送信しました
        </h1>

        {email && (
          <p className="text-[var(--color-neutral-700)] mb-4">
            <span className="font-medium">{email}</span>
          </p>
        )}

        <p className="text-[var(--color-neutral-700)] mb-6 text-justify">
          メールに記載されているリンクをクリックしてメールアドレスの確認を完了してください。
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-[var(--color-neutral-700)]">
            <strong>ご注意：</strong>
          </p>
          <ul className="text-sm text-[var(--color-neutral-700)] mt-2 space-y-1 list-disc list-inside text-justify">
            <li>
              メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </li>
            <li>リンクの有効期限は24時間です。</li>
          </ul>
        </div>

        <Link href="/auth/signin">
          <Button
            variant="outline"
            className="w-full h-12 border-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-200)]"
          >
            ログインページへ戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
