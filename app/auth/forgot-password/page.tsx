'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // メールアドレスの基本的なバリデーション
  const isValidEmail = (email: string) => {
    const trimmed = email.trim();
    if (trimmed.length < 5) return false;
    const atIndex = trimmed.indexOf('@');
    if (atIndex < 1) return false;
    const dotAfterAt = trimmed.indexOf('.', atIndex);
    if (dotAfterAt < 0) return false;
    return dotAfterAt > atIndex + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] px-4">
      <div className="max-w-md w-full bg-[var(--color-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--color-neutral-300)]">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/login.png"
            alt="パスワードリセット"
            className="mx-auto mb-4"
            style={{ maxWidth: "100%", height: "auto" }}
          />
          <h2 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-2">
            パスワードをお忘れですか？
          </h2>
          <p className="text-sm text-[var(--color-neutral-600)] text-justify">
            登録したメールアドレスを入力してください。<br/>
            パスワードリセット用のリンクをお送りします。
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-lg">
              <p className="text-sm text-[var(--color-success-text)] mb-2">
                ✓ パスワードリセット用のリンクをメールで送信しました
              </p>
              <ul className="text-xs text-[var(--color-neutral-700)] list-disc pl-5 space-y-1">
                <li>メールが届かない場合は、迷惑メールフォルダをご確認ください</li>
                <li>リンクの有効期限は1時間です</li>
              </ul>
            </div>
            <Link href="/auth/signin">
              <Button className="w-full bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)] text-white">
                ログイン画面に戻る
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-lg text-[var(--color-error-text)] text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--color-neutral-900)]">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  // 半角英数字と@._-のみ許可（全角を防ぐ）
                  const value = e.target.value.replace(/[^a-zA-Z0-9@._-]/g, '');
                  setEmail(value);
                }}
                onPaste={(e) => {
                  // ペースト時も半角のみ許可
                  e.preventDefault();
                  const pastedText = e.clipboardData.getData('text');
                  const sanitized = pastedText.replace(/[^a-zA-Z0-9@._-]/g, '');
                  setEmail(sanitized);
                }}
                required
                disabled={isLoading}
                className="w-full px-4 py-2 border border-[var(--color-neutral-400)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] bg-white"
                placeholder="example@email.com"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)] text-white disabled:opacity-50"
              disabled={isLoading || !isValidEmail(email)}
            >
              {isLoading ? 'リセットリンクを送信中...' : 'リセットリンクを送信'}
            </Button>

            <div className="text-center text-sm text-[var(--color-neutral-700)] mt-4">
              <Link
                href="/auth/signin"
                className="text-[var(--color-primary-green)] hover:underline font-medium"
              >
                ログイン画面に戻る
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
