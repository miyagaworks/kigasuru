'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { authBridge } from '@/utils/pwa-auth-bridge';

export default function PWACallbackPage() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 20; // 10秒間（500ms × 20回）

  useEffect(() => {
    // クライアントサイドでのみデバッグモードをチェック
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setShowDebug(process.env.NODE_ENV === 'development' || urlParams.get('debug') === 'true');
    }
  }, []);

  useEffect(() => {

    const handleCallback = async () => {
      const logs: string[] = [];

      // タイムスタンプを追加
      logs.push(`=== PWA Callback Debug (${new Date().toISOString()}) ===`);
      logs.push(`Retry Count: ${retryCount}`);

      // デバッグ情報を追加
      logs.push(`Status: ${status}`);
      logs.push(`Session: ${session ? 'exists' : 'null'}`);
      if (session) {
        logs.push(`Session User: ${JSON.stringify(session.user)}`);
      }
      logs.push(`Full URL: ${window.location.href}`);

      // URLパラメータを確認
      const urlParams = new URLSearchParams(window.location.search);
      const paramsArray = Array.from(urlParams);
      logs.push(`URL Params Count: ${paramsArray.length}`);
      paramsArray.forEach(([key, value]) => {
        logs.push(`  - ${key}: ${value}`);
      });

      // iOS PWAカスタムハンドラーからのパラメータ
      const authStatus = urlParams.get('status');
      const userId = urlParams.get('user_id');
      const userName = urlParams.get('user_name');
      const userEmail = urlParams.get('user_email');
      const userImage = urlParams.get('user_image');

      if (authStatus === 'success' && userId) {
        logs.push(`Auth Status: ${authStatus}`);
        logs.push(`User ID: ${userId}`);
        logs.push(`User Name: ${decodeURIComponent(userName || '')}`);
        logs.push(`User Email: ${decodeURIComponent(userEmail || '')}`);
      }

      // NextAuthのコールバックパラメータも確認
      const callbackUrl = urlParams.get('callbackUrl');
      if (callbackUrl) {
        logs.push(`NextAuth CallbackUrl: ${callbackUrl}`);
      }

      // エラーパラメータをチェック
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      if (errorParam) {
        logs.push(`!!! OAuth Error Detected !!!`);
        logs.push(`OAuth Error: ${errorParam}`);
        logs.push(`Error Description: ${errorDescription || 'N/A'}`);

        // すべてのログをコンソールに出力
        console.error('=== PWA OAuth Error Debug ===');
        logs.forEach(log => console.error(log));

        // 認証エラーの場合、すぐにリダイレクト
        const returnUrl = new URL(window.location.origin);
        returnUrl.pathname = '/auth/signin';
        returnUrl.searchParams.set('error', errorDescription || errorParam);

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

      // iOS PWAカスタムハンドラーからのセッションチェック
      if (authStatus === 'success' && userId) {
        logs.push('✅ iOS PWA custom auth successful');

        // すべてのログをコンソールに出力（成功時）
        console.log('=== iOS PWA OAuth Success Debug ===');
        logs.forEach(log => console.log(log));

        // 認証成功：ユーザー情報をCache APIに保存
        await authBridge.saveAuthToken({
          token: bridgeToken,
          provider: urlParams.get('provider') || 'oauth',
          callbackUrl: '/dashboard',
          userData: {
            id: userId,
            name: decodeURIComponent(userName || ''),
            email: decodeURIComponent(userEmail || ''),
            image: userImage ? decodeURIComponent(userImage) : null
          }
        });

        // PWAに戻る
        const returnUrl = new URL(window.location.origin);
        returnUrl.pathname = '/dashboard';
        returnUrl.searchParams.set('pwa_bridge_success', 'true');
        returnUrl.searchParams.set('pwa_bridge_token', bridgeToken);
        returnUrl.searchParams.set('user_id', userId);

        // iOS PWAの場合、location.hrefで遷移
        window.location.href = returnUrl.toString();
        return;
      }

      // 通常のNextAuthセッション待ち（Google認証などで使用）
      if (status === 'loading' || (status === 'unauthenticated' && retryCount < maxRetries && authStatus !== 'success')) {
        logs.push(`Waiting for session... (retry ${retryCount}/${maxRetries})`);

        // コンソールにもリアルタイムで出力
        console.log(`PWA Callback: Waiting for session (retry ${retryCount}/${maxRetries})`);

        setDebugInfo(logs);

        // 500ms後にリトライ
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 500);
        return;
      }

      logs.push(`=== Final Status Check ===`);
      logs.push(`Status: ${status}`);
      logs.push(`Session exists: ${!!session}`);
      logs.push(`Retry count reached: ${retryCount}`);

      if (status === 'authenticated' && session) {
        logs.push('✅ Authentication successful');
        logs.push(`User: ${JSON.stringify(session.user)}`);

        // すべてのログをコンソールに出力（成功時）
        console.log('=== PWA OAuth Success Debug ===');
        logs.forEach(log => console.log(log));

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
        logs.push('❌ Authentication failed - no session after retries');
        logs.push(`Total retries: ${retryCount}`);

        // すべてのログをコンソールに出力（失敗時）
        console.error('=== PWA OAuth Failed Debug ===');
        logs.forEach(log => console.error(log));

        // 認証失敗
        const returnUrl = new URL(window.location.origin);
        returnUrl.pathname = '/auth/signin';
        returnUrl.searchParams.set('error', 'OAuth認証に失敗しました');

        window.location.href = returnUrl.toString();
      }

      setDebugInfo(logs);
    };

    handleCallback();
  }, [session, status, retryCount]);

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