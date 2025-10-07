'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return '認証設定にエラーがあります。管理者にお問い合わせください。';
      case 'AccessDenied':
        return 'アクセスが拒否されました。';
      case 'Verification':
        return 'メール認証に失敗しました。リンクの有効期限が切れている可能性があります。';
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return 'ログインに失敗しました。もう一度お試しください。';
      case 'OAuthAccountNotLinked':
        return 'このメールアドレスは既に別の方法で登録されています。元の方法でログインしてください。';
      case 'EmailSignin':
        return 'メール送信に失敗しました。もう一度お試しください。';
      case 'CredentialsSignin':
        return 'メールアドレスまたはパスワードが正しくありません。';
      case 'SessionRequired':
        return 'ログインが必要です。';
      default:
        return '認証エラーが発生しました。もう一度お試しください。';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] px-4">
      <div className="max-w-md w-full bg-[var(--color-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--color-neutral-300)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--color-error-bg)] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--color-error-border)]">
            <svg
              className="w-8 h-8 text-[var(--color-error-text)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-2">認証エラー</h1>
          <p className="text-[var(--color-neutral-700)] mb-8">{getErrorMessage()}</p>


          <div className="flex flex-col gap-3">
            <Link href="/auth/signin" className="block">
              <Button className="w-full h-12 bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)] text-white">ログインページに戻る</Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full h-12 border-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-200)]">
                トップページへ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
