'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
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
    } catch (error) {
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
      case 'line':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00B900">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
        );
      default:
        return <Icon icon="mail" className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* PWAアクセス必須通知 */}
      {needsAdditionalAuth && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                PWAアプリを使用するには追加の認証方法が必要です
              </h4>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                LINE認証のみでは、iOS PWAアプリにログインできません。
                GoogleアカウントまたはメールアドレスでのログインをPWAで使用するために、以下のいずれかを設定してください。
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
            <div key={provider} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {getProviderIcon(provider)}
              <span className="capitalize">{provider === 'line' ? 'LINE' : provider}</span>
              <span className="ml-auto text-sm text-green-600 dark:text-green-400">連携済み</span>
            </div>
          ))}
          {hasPassword && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Icon icon="mail" className="w-5 h-5" />
              <span>メールアドレス</span>
              <span className="ml-auto text-sm text-green-600 dark:text-green-400">設定済み</span>
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
                    <Icon icon="mail" className="w-5 h-5" />
                    パスワードを設定
                  </Button>
                ) : (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">新しいパスワード</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg pr-10"
                          placeholder="8文字以上"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <Icon icon={showPassword ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">パスワードを確認</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
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