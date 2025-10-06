'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // トークンの有効性をチェック
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        setIsValidToken(response.ok);
      } catch {
        setIsValidToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // トークンチェック中
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-green)] mx-auto"></div>
          <p className="mt-4 text-sm text-[var(--color-neutral-600)]">確認中...</p>
        </div>
      </div>
    );
  }

  // トークンが無効
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] px-4">
        <div className="max-w-md w-full bg-[var(--color-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--color-neutral-300)] text-center">
          <h2 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4">
            無効なリンク
          </h2>
          <p className="text-sm text-[var(--color-neutral-600)] mb-6">
            パスワードリセット用のリンクが無効か期限切れです。<br/>
            再度パスワードリセットをリクエストしてください。
          </p>
          <Link href="/auth/forgot-password">
            <Button className="w-full bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)] text-white">
              パスワードリセットを再リクエスト
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            新しいパスワード設定
          </h2>
          <p className="text-sm text-[var(--color-neutral-600)]">
            新しいパスワードを入力してください
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-lg">
              <p className="text-sm text-[var(--color-success-text)]">
                ✓ パスワードが正常にリセットされました<br/>
                新しいパスワードでログインしてください
              </p>
            </div>
            <p className="text-xs text-center text-[var(--color-neutral-600)]">
              3秒後にログイン画面に移動します...
            </p>
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
                新しいパスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    // 半角英数字と記号のみ許可（全角を防ぐ）
                    const value = e.target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
                    setPassword(value);
                  }}
                  onPaste={(e) => {
                    // ペースト時も半角のみ許可
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    const sanitized = pastedText.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
                    setPassword(sanitized);
                  }}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 pr-12 border border-[var(--color-neutral-400)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] bg-white"
                  placeholder="••••••••（8文字以上）"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 flex items-center text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] focus:outline-none z-10"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    minHeight: 'auto',
                    minWidth: 'auto',
                  }}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--color-neutral-900)]">
                パスワード確認
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    // 半角英数字と記号のみ許可（全角を防ぐ）
                    const value = e.target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
                    setConfirmPassword(value);
                  }}
                  onPaste={(e) => {
                    // ペースト時も半角のみ許可
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    const sanitized = pastedText.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
                    setConfirmPassword(sanitized);
                  }}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 pr-12 border border-[var(--color-neutral-400)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 flex items-center text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] focus:outline-none z-10"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    minHeight: 'auto',
                    minWidth: 'auto',
                  }}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)] text-white disabled:opacity-50"
              disabled={
                isLoading ||
                !password.trim() ||
                !confirmPassword.trim() ||
                password.length < 8 ||
                password !== confirmPassword
              }
            >
              {isLoading ? 'パスワード変更中...' : 'パスワードを変更'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-green)] mx-auto"></div>
            <p className="mt-4 text-sm text-[var(--color-neutral-600)]">読み込み中...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
