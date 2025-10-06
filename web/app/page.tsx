'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

/**
 * Landing page - Login/Signup selection
 */
export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();

  // 認証済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // ローディング中
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-green)]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* App logo and title */}
          <div className="text-center mb-8">
            <Image
              src="/logo_top.svg"
              alt="上手くなる気がするぅぅぅ PRO"
              width={800}
              height={467}
              className="mx-auto mb-4"
              style={{ maxWidth: "100%", height: "auto" }}
              priority
            />
            <p className="text-base text-[var(--color-neutral-900)] mb-8">
              本気で自己ベスト更新を狙う人のための<br />
              ゆるい名前の科学的ゴルフ上達アプリ
            </p>
          </div>

          {/* Auth buttons */}
          <div className="space-y-4 bg-[var(--color-card-bg)] rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-center text-[var(--color-neutral-900)] mb-6">
              はじめましょう
            </h2>

            <Button
              variant="primary"
              onClick={() => router.push('/auth/signin')}
              className="w-full py-4 text-lg font-semibold bg-[var(--color-primary-green)] hover:bg-green-700"
            >
              ログイン
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/auth/signup')}
              className="w-full py-4 text-lg font-semibold border-2 border-[var(--color-primary-green)] text-[var(--color-primary-green)] hover:bg-green-50"
            >
              新規登録
            </Button>
          </div>

          {/* Features */}
          <div className="mt-8 space-y-2">
            <div className="flex items-center gap-3 bg-[var(--color-card-bg)] rounded-lg p-4 shadow-sm">
              <Icon category="ui" name="settings" size={24} className="flex-shrink-0 text-[var(--color-primary-green)]" />
              <p className="text-base font-semibold text-[var(--color-neutral-900)]">ジャイロセンサーで傾斜を自動測定</p>
            </div>
            <div className="flex items-center gap-3 bg-[var(--color-card-bg)] rounded-lg p-4 shadow-sm">
              <Icon category="ui" name="analysis" size={24} className="flex-shrink-0 text-[var(--color-primary-green)]" />
              <p className="text-base font-semibold text-[var(--color-neutral-900)]">クラブ別の詳細なショット分析</p>
            </div>
            <div className="flex items-center gap-3 bg-[var(--color-card-bg)] rounded-lg p-4 shadow-sm">
              <Icon category="ui" name="check" size={24} className="flex-shrink-0 text-[var(--color-primary-green)]" />
              <p className="text-base font-semibold text-[var(--color-neutral-900)]">オフラインでも使える安心設計</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 mb-8 text-[var(--color-neutral-500)] text-sm">
        <p>&copy; 2025 上手くなる気がするぅぅぅ. All rights reserved.</p>
      </div>
    </div>
  );
}
