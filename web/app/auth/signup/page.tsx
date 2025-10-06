'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上である必要があります');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || '登録に失敗しました');
        setLoading(false);
        return;
      }

      // 登録成功後、メール認証待ちページへリダイレクト
      const data = await response.json();
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email || email)}`);
    } catch {
      setError('登録処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: 'google' | 'line') => {
    setError(null);
    setLoading(true);

    // サインアップフローであることを示すクッキーを設定
    document.cookie = 'is_signup_flow=true; path=/; max-age=600';

    try {
      await signIn(provider, {
        callbackUrl: '/dashboard',
      });
    } catch {
      setError(`${provider === 'google' ? 'Google' : 'LINE'}登録に失敗しました`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] px-4 py-8">
      <div className="max-w-md w-full bg-[var(--color-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--color-neutral-300)]">
        <div className="text-center mb-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/signup.png"
            alt="新規登録"
            className="mx-auto mb-0"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-lg text-[var(--color-error-text)] text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* LINE Sign Up */}
          <button
            onClick={() => handleOAuthSignUp("line")}
            disabled={loading}
            className="w-full h-12 bg-[#00B900] text-white rounded-lg font-medium hover:bg-[#00A000] transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEで登録
          </button>

          {/* Google Sign Up */}
          <Button
            variant="outline"
            className="w-full h-12 border-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-200)] flex items-center justify-center gap-2"
            onClick={() => handleOAuthSignUp("google")}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleで登録
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-neutral-400)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--color-card-bg)] text-[var(--color-neutral-600)]">
                または
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--color-neutral-900)]">
                名前
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-[var(--color-neutral-400)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] bg-white"
                placeholder="山田太郎"
              />
            </div>
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
                disabled={loading}
                className="w-full px-4 py-2 border border-[var(--color-neutral-400)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] bg-white"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--color-neutral-900)]">
                パスワード（8文字以上）
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
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
                  disabled={loading}
                  className="w-full px-4 py-2 pr-12 border border-[var(--color-neutral-400)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] bg-white"
                  placeholder="8文字以上"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 flex items-center text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] focus:outline-none z-10"
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    minHeight: "auto",
                    minWidth: "auto",
                  }}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--color-neutral-900)]">
                パスワード（確認）
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
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
                  disabled={loading}
                  className="w-full px-4 py-2 pr-12 border border-[var(--color-neutral-400)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] bg-white"
                  placeholder="再度入力"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 flex items-center text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] focus:outline-none z-10"
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    minHeight: "auto",
                    minWidth: "auto",
                  }}
                >
                  {showConfirmPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                loading ||
                !name.trim() ||
                !isValidEmail(email) ||
                !password.trim() ||
                !confirmPassword.trim() ||
                password.length < 8 ||
                password !== confirmPassword
              }
            >
              {loading ? "登録中..." : "登録"}
            </Button>
          </form>

          <div className="text-center text-sm text-[var(--color-neutral-700)] mt-6">
            すでにアカウントをお持ちの場合は{" "}
            <Link
              href="/auth/signin"
              className="text-[var(--color-primary-green)] hover:underline font-medium"
            >
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
