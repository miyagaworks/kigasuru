'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

/**
 * メール確認待ちページのコンテンツ
 */
function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResendEmail = async () => {
    if (!email) {
      setResendMessage('メールアドレスが見つかりません');
      return;
    }

    setIsResending(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendMessage('確認メールを再送信しました');
      } else {
        const data = await response.json();
        setResendMessage(data.error || '再送信に失敗しました');
      }
    } catch (error) {
      console.error('Failed to resend email:', error);
      setResendMessage('エラーが発生しました');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-8 max-w-md w-full">
        {/* アイコン */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[var(--color-info-bg)] flex items-center justify-center">
            <Icon
              category="ui"
              name="mail"
              size={32}
              className="text-[var(--color-secondary-blue)]"
            />
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] text-center mb-4">
          確認メールを送信しました
        </h1>

        {/* メールアドレス表示 */}
        {email && (
          <p className="text-center text-[var(--color-neutral-700)] mb-6">
            <strong>{email}</strong> 宛に確認メールを送信しました
          </p>
        )}

        {/* 注意事項リスト */}
        <ul className="space-y-3 mb-6 text-[var(--color-neutral-700)]">
          <li className="flex">
            <span className="mr-2 flex-shrink-0">•</span>
            <span className="flex-1">
              メールが届かない場合は、迷惑メールフォルダをご確認ください
            </span>
          </li>
          <li className="flex">
            <span className="mr-2 flex-shrink-0">•</span>
            <span className="flex-1">リンクの有効期限は24時間です</span>
          </li>
        </ul>

        {/* メール再送信ボタン */}
        <Button
          variant="outline"
          onClick={handleResendEmail}
          disabled={isResending || !email}
          className="w-full mb-4"
        >
          {isResending ? "送信中..." : "もう一度メールを送信"}
        </Button>

        {/* 再送信メッセージ */}
        {resendMessage && (
          <div
            className={`p-3 rounded-lg text-sm text-center ${
              resendMessage.includes("成功") ||
              resendMessage.includes("再送信しました")
                ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                : "bg-[var(--color-error-bg)] text-[var(--color-error-text)]"
            }`}
          >
            {resendMessage}
          </div>
        )}

        {/* ログインページへのリンク */}
        <div className="text-center mt-6">
          <a
            href="/auth/signin"
            className="text-[var(--color-primary-green)] hover:underline text-sm"
          >
            ログインページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * メール確認待ちページ
 */
export default function VerifyRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-green)]"></div>
        </div>
      </div>
    }>
      <VerifyRequestContent />
    </Suspense>
  );
}
