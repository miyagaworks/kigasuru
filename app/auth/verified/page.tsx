'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] px-4">
      <div className="max-w-md w-full bg-[var(--color-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--color-neutral-300)] text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-[var(--color-success-border)] rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-[var(--color-primary-light)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4">
          メール認証完了
        </h1>

        <p className="text-[var(--color-neutral-700)] mb-8">
          メールアドレスの認証が完了しました。
          <br />
          ログインしてKigasuruをお楽しみください。
        </p>

        <Link href="/auth/signin">
          <Button className="w-full h-12 bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)] text-white">
            ログインページへ
          </Button>
        </Link>
      </div>
    </div>
  );
}
