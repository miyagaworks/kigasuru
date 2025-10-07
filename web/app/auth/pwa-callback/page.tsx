'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { authBridge } from '@/utils/pwa-auth-bridge';

export default function PWACallbackPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleCallback = async () => {
      // ブリッジトークンを取得
      const bridgeToken = authBridge.getBridgeTokenFromUrl();

      if (!bridgeToken) {
        console.error('No bridge token found');
        return;
      }

      // セッションが確立されるまで待つ
      if (status === 'loading') return;

      if (status === 'authenticated' && session) {
        // 認証成功：セッション情報をCache APIに保存
        await authBridge.saveAuthToken({
          token: bridgeToken,
          provider: 'oauth',
          callbackUrl: '/dashboard'
        });

        // PWAに戻る
        const returnUrl = new URL(window.location.origin);
        returnUrl.pathname = '/dashboard';
        returnUrl.searchParams.set('pwa_bridge_success', 'true');
        returnUrl.searchParams.set('pwa_bridge_token', bridgeToken);

        // iOS PWAの場合、location.hrefで遷移
        window.location.href = returnUrl.toString();
      } else if (status === 'unauthenticated') {
        // 認証失敗
        const returnUrl = new URL(window.location.origin);
        returnUrl.pathname = '/auth/signin';
        returnUrl.searchParams.set('error', 'OAuth認証に失敗しました');

        window.location.href = returnUrl.toString();
      }
    };

    handleCallback();
  }, [session, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-green)] mx-auto mb-4"></div>
        <p className="text-[var(--color-neutral-700)]">認証処理中...</p>
        <p className="text-sm text-[var(--color-neutral-600)] mt-2">
          PWAに戻ります。しばらくお待ちください。
        </p>
      </div>
    </div>
  );
}