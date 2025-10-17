'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authBridge } from '@/utils/pwa-auth-bridge';

export const dynamic = 'force-dynamic';

function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  // Check if running in PWA mode
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = 'standalone' in window.navigator &&
                              (window.navigator as { standalone?: boolean }).standalone === true;

      setIsPWA(isStandalone || isIOSStandalone);

    };
    checkPWA();

    // URL パラメータからエラーメッセージを取得
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    // URL パラメータからメールアドレスを取得（新規登録からのリダイレクト時）
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    // PWAブリッジ成功時の処理
    const checkBridgeSuccess = async () => {
      if (searchParams?.get('pwa_bridge_success') === 'true') {
        const bridgeToken = searchParams?.get('pwa_bridge_token');
        if (bridgeToken) {
          // キャッシュから認証情報を確認
          const authData = await authBridge.getAuthToken();
          if (authData && authData.token === bridgeToken) {
            // 認証成功、ダッシュボードへリダイレクト
            window.location.href = authData.callbackUrl || '/dashboard';
          }
        }
      }
    };

    checkBridgeSuccess();
  }, [searchParams]);

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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuthからのエラーメッセージをチェック
        if (result.error === 'CredentialsSignin') {
          setError('メールアドレスまたはパスワードが正しくありません');
        } else if (result.error.includes('ログイン試行回数')) {
          // ロックアウトメッセージを表示
          setError(result.error);
        } else {
          setError('ログインに失敗しました');
        }
      } else if (result?.ok) {
        // ログインイベントを記録（非同期、エラーは無視）
        fetch('/api/auth/login-event', { method: 'POST' }).catch(() => {});
        window.location.href = searchParams?.get('callbackUrl') || '/dashboard';
      }
    } catch (err) {
      // キャッチしたエラーがロックアウトメッセージの場合
      if (err instanceof Error && err.message.includes('ログイン試行回数')) {
        setError(err.message);
      } else {
        setError('ログインに失敗しました');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google') => {
    setError(null);
    setOauthLoading(true);

    try {
      const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

      if (isPWA) {
        // iOS PWAの検出（PWAモード AND iOSデバイス）
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
          // iOS PWA: Google認証をサポート
          // Google認証は通常のsignInを使用
          await signIn(provider, {
            callbackUrl: `${callbackUrl}?from=signin`,
            redirect: true,
          });
          return;
        }

        // その他のPWA: ポップアップウィンドウで認証
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const authWindow = window.open(
          `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`,
          'oauth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
        );

        if (!authWindow) {
          setError('ポップアップがブロックされました。ブラウザの設定を確認してください。');
          setOauthLoading(false);
          return;
        }

        // ポップアップの監視
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            // ポップアップが閉じられたら、認証状態を確認してリロード
            setTimeout(() => {
              window.location.href = callbackUrl;
            }, 500);
          }
        }, 500);

        // タイムアウト（5分）
        setTimeout(() => {
          if (!authWindow.closed) {
            authWindow.close();
            clearInterval(checkClosed);
            setError('認証がタイムアウトしました');
            setOauthLoading(false);
          }
        }, 5 * 60 * 1000);
      } else {
        // 通常のブラウザモード: OAuth認証はプロバイダーページへの遷移が必要
        await signIn(provider, {
          callbackUrl: `${callbackUrl}?from=signin`,
          redirect: true, // OAuthでは必ずtrueにする（プロバイダーページへ遷移）
        });
        // signInでredirect: trueの場合、この行には到達しない
      }
    } catch {
      setError('Googleログインに失敗しました');
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] px-4 py-8">
      <div className="max-w-md w-full bg-[var(--color-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--color-neutral-300)]">
        <div className="text-center mb-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/login.png"
            alt="ログイン"
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
          {/* Google Login */}
          <Button
            variant="outline"
            className="w-full h-12 border-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-200)] flex items-center justify-center gap-2"
            onClick={() => handleOAuthSignIn('google')}
            disabled={oauthLoading || emailLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleでログイン
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-neutral-400)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--color-card-bg)] text-[var(--color-neutral-600)]">または</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--color-neutral-900)]">メールアドレス</label>
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
                disabled={emailLoading || oauthLoading}
                autoComplete="email"
                className="w-full px-4 py-2 border border-[var(--color-neutral-400)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] bg-white"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--color-neutral-900)]">パスワード</label>
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
                  disabled={emailLoading || oauthLoading}
                  autoComplete="current-password"
                  className="w-full px-4 py-2 pr-12 border border-[var(--color-neutral-400)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] bg-white"
                  placeholder="••••••••"
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
            <Button
              type="submit"
              className="w-full h-12 bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={emailLoading || oauthLoading || !isValidEmail(email) || !password.trim() || password.length < 8}
            >
              {emailLoading ? 'ログイン中...' : 'ログイン'}
            </Button>

            <div className="text-center text-sm text-[var(--color-neutral-700)] mt-4">
              <Link
                href="/auth/forgot-password"
                className="text-[var(--color-primary-green)] hover:underline font-medium"
              >
                パスワードをお忘れですか？
              </Link>
            </div>
          </form>

          <div className="text-center text-sm text-[var(--color-neutral-700)] mt-6">
            アカウントをお持ちでない場合は{' '}
            <Link href="/auth/signup" className="text-[var(--color-primary-green)] hover:underline font-medium">
              新規登録
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <SignInForm />
    </Suspense>
  );
}
