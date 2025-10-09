'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface AuthProvidersProps {
  authProviders: string[];
  hasPassword: boolean;
  needsAdditionalAuth: boolean;
}

export function AuthProviders({ authProviders, hasPassword, needsAdditionalAuth }: AuthProvidersProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleLinkGoogle = async () => {
    try {
      setIsLinking(true);
      // Googleアカウントをリンク
      await signIn('google', {
        callbackUrl: '/account?linked=google',
        redirect: true,
      });
    } catch {
      toast.error('Googleアカウントの連携に失敗しました');
      setIsLinking(false);
    }
  };

  const handleSetPassword = async () => {
    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.error('パスワードが一致しません');
      return;
    }

    if (passwordForm.password.length < 8) {
      toast.error('パスワードは8文字以上で入力してください');
      return;
    }

    try {
      setIsLinking(true);
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: passwordForm.password,
        }),
      });

      if (!response.ok) {
        throw new Error('パスワードの設定に失敗しました');
      }

      toast.success('パスワードを設定しました');
      setShowPasswordForm(false);
      setPasswordForm({ password: '', confirmPassword: '' });
      window.location.reload();
    } catch {
      toast.error('パスワードの設定に失敗しました');
    } finally {
      setIsLinking(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* PWAアクセス必須通知 */}
      {needsAdditionalAuth && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-yellow-900">
                PWAアプリを使用するには認証方法の設定が必要です
              </h4>
              <p className="mt-1 text-sm text-yellow-700">
                PWAアプリにログインするために、GoogleアカウントまたはメールアドレスでのログインをPWAで使用するための設定が必要です。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 現在の認証方法 */}
      <div>
        <h3 className="font-medium mb-3">現在の認証方法</h3>
        <div className="space-y-2">
          {authProviders.map(provider => (
            <div key={provider} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {getProviderIcon(provider)}
              <span className="capitalize">{provider}</span>
              <span className="ml-auto text-sm text-green-600">連携済み</span>
            </div>
          ))}
          {hasPassword && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>メールアドレス</span>
              <span className="ml-auto text-sm text-green-600">設定済み</span>
            </div>
          )}
        </div>
      </div>

      {/* 認証方法の追加 */}
      {needsAdditionalAuth && (
        <div>
          <h3 className="font-medium mb-3">認証方法を追加</h3>
          <div className="space-y-3">
            {!authProviders.includes('google') && (
              <Button
                onClick={handleLinkGoogle}
                disabled={isLinking}
                className="w-full justify-start gap-3"
                variant="outline"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Googleアカウントを連携
              </Button>
            )}

            {!hasPassword && (
              <>
                {!showPasswordForm ? (
                  <Button
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full justify-start gap-3"
                    variant="outline"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
                    パスワードを設定
                  </Button>
                ) : (
                  <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">新しいパスワード</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                          placeholder="8文字以上"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                      <label className="block text-sm font-medium mb-1">パスワードを確認</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="同じパスワードを入力"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSetPassword}
                        disabled={isLinking || !passwordForm.password || !passwordForm.confirmPassword}
                        className="flex-1"
                      >
                        パスワードを設定
                      </Button>
                      <Button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordForm({ password: '', confirmPassword: '' });
                        }}
                        variant="outline"
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}