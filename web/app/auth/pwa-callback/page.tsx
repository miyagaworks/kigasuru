'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { authBridge } from '@/utils/pwa-auth-bridge';

export default function PWACallbackPage() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // クライアントサイドでのみデバッグモードをチェック
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setShowDebug(process.env.NODE_ENV === 'development' || urlParams.get('debug') === 'true');
    }
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20; // 10秒間（500ms × 20回）

    const handleCallback = async () => {
      const logs: string[] = [];

      // デバッグ情報を追加
      logs.push(`Status: ${status}`);
      logs.push(`Session: ${session ? 'exists' : 'null'}`);
      logs.push(`URL: ${window.location.href}`);

      // URLパラメータを確認
      const urlParams = new URLSearchParams(window.location.search);
      logs.push(`URL Params: ${Array.from(urlParams).map(([key, value]) => `${key}=${value}`).join(', ')}`);

      // エラーパラメータをチェック
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      if (errorParam) {
        logs.push(`OAuth Error: ${errorParam}`);
        logs.push(`Error Description: ${errorDescription || 'N/A'}`);

        // 認証エラーの場合、すぐにリダイレクト
        const returnUrl = new URL(window.location.origin);
        returnUrl.pathname = '/auth/signin';
        returnUrl.searchParams.set('error', errorDescription || errorParam);

        console.error('OAuth Error:', errorParam, errorDescription);
        window.location.href = returnUrl.toString();
        return;
      }

      // Cookieの存在を確認
      logs.push(`Cookies: ${document.cookie ? 'exists' : 'empty'}`);

      // ブリッジトークンを取得
      const bridgeToken = authBridge.getBridgeTokenFromUrl();
      logs.push(`Bridge Token: ${bridgeToken || 'not found'}`);

      if (!bridgeToken) {
        console.error('No bridge token found');
        setDebugInfo(logs);
        return;
      }

      // セッションが確立されるまで待つ
      if (status === 'loading' || (status === 'unauthenticated' && retryCount < maxRetries)) {
        logs.push(`Waiting for session... (retry ${retryCount}/${maxRetries})`);
        setDebugInfo(logs);

        // 500ms後にリトライ
        setTimeout(() => {
          retryCount++;
          handleCallback();
        }, 500);
        return;
      }

      if (status === 'authenticated' && session) {
        logs.push('Authentication successful');
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
        logs.push('Authentication failed - no session');

        // 認証失敗
        const returnUrl = new URL(window.location.origin);
        returnUrl.pathname = '/auth/signin';
        returnUrl.searchParams.set('error', 'OAuth認証に失敗しました');

        // エラー詳細をコンソールに出力
        console.error('PWA Callback Debug Info:', logs);

        window.location.href = returnUrl.toString();
      }

      setDebugInfo(logs);
    };

    handleCallback();
  }, [session, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] px-4">
      <div className="max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-green)] mx-auto mb-4"></div>
        <p className="text-[var(--color-neutral-700)]">認証処理中...</p>
        <p className="text-sm text-[var(--color-neutral-600)] mt-2">
          PWAに戻ります。しばらくお待ちください。
        </p>

        {/* デバッグ情報（開発環境またはdebug=trueパラメータがある場合） */}
        {showDebug && debugInfo.length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
            <p className="font-bold mb-2">Debug Info:</p>
            {debugInfo.map((log, index) => (
              <p key={index} className="text-gray-600">{log}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}