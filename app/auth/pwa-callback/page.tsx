'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { authBridge } from '@/utils/pwa-auth-bridge';

export default function PWACallbackPage() {
  const { data: session, status } = useSession();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 20; // 10秒間（500ms × 20回）


  useEffect(() => {

    const handleCallback = async () => {
      // URLパラメータを確認
      const urlParams = new URLSearchParams(window.location.search);

      // ブリッジトークンを最初に取得（エラー処理で使用するため）
      const bridgeToken = authBridge.getBridgeTokenFromUrl();

      // iOS PWAカスタムハンドラーからのパラメータ
      const authStatus = urlParams.get('status');
      const userId = urlParams.get('user_id');
      const userName = urlParams.get('user_name');
      const userEmail = urlParams.get('user_email');
      const userImage = urlParams.get('user_image');

      if (authStatus === 'success' && userId) {
        // logs.push(`Auth Status: ${authStatus}`);
        // logs.push(`User ID: ${userId}`);
        // logs.push(`User Name: ${decodeURIComponent(userName || '')}`);
        // logs.push(`User Email: ${decodeURIComponent(userEmail || '')}`);
      }

      // NextAuthのコールバックパラメータも確認
      const callbackUrl = urlParams.get('callbackUrl');
      if (callbackUrl) {
        // logs.push(`NextAuth CallbackUrl: ${callbackUrl}`);
      }

      // エラーパラメータをチェック
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      if (errorParam) {
        // 認証エラーの場合、すぐにリダイレクト
        const returnUrl = new URL(window.location.origin);
        returnUrl.pathname = '/auth/signin';
        returnUrl.searchParams.set('error', errorDescription || errorParam);

        window.location.href = returnUrl.toString();
        return;
      }

      // Cookieの存在を確認
      // logs.push(`Cookies: ${document.cookie ? 'exists' : 'empty'}`);

      if (!bridgeToken) {
        return;
      }

      // iOS PWAカスタムハンドラーからのセッションチェック
      if (authStatus === 'success' && userId) {
        // logs.push('✅ iOS PWA custom auth successful');

        // すべてのログをコンソールに出力（成功時）
        // console.log('=== iOS PWA OAuth Success Debug ===');
        // logs.forEach(log => // console.log(log));

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

        // ポップアップウィンドウの場合は、自己を閉じる
        if (window.opener && window.opener !== window) {
          // logs.push('Closing popup window after successful auth');
          // console.log('Closing OAuth popup window');
          window.close();
        } else {
          // PWAに戻る（ポップアップでない場合）
          const returnUrl = new URL(window.location.origin);
          returnUrl.pathname = '/dashboard';
          returnUrl.searchParams.set('pwa_bridge_success', 'true');
          returnUrl.searchParams.set('pwa_bridge_token', bridgeToken);
          returnUrl.searchParams.set('user_id', userId);

          // iOS PWAの場合、location.hrefで遷移
          window.location.href = returnUrl.toString();
        }
        return;
      }

      // 通常のNextAuthセッション待ち（Google認証などで使用）
      if (status === 'loading' || (status === 'unauthenticated' && retryCount < maxRetries && authStatus !== 'success')) {
        // logs.push(`Waiting for session... (retry ${retryCount}/${maxRetries})`);

        // コンソールにもリアルタイムで出力
        // console.log(`PWA Callback: Waiting for session (retry ${retryCount}/${maxRetries})`);


        // 500ms後にリトライ
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 500);
        return;
      }

      // logs.push(`=== Final Status Check ===`);
      // logs.push(`Status: ${status}`);
      // logs.push(`Session exists: ${!!session}`);
      // logs.push(`Retry count reached: ${retryCount}`);

      if (status === 'authenticated' && session) {
        // logs.push('✅ Authentication successful');
        // logs.push(`User: ${JSON.stringify(session.user)}`);

        // すべてのログをコンソールに出力（成功時）
        // console.log('=== PWA OAuth Success Debug ===');
        // logs.forEach(log => // console.log(log));

        // 認証成功：セッション情報をCache APIに保存
        await authBridge.saveAuthToken({
          token: bridgeToken,
          provider: 'oauth',
          callbackUrl: '/dashboard'
        });

        // ポップアップウィンドウの場合は、自己を閉じる
        if (window.opener && window.opener !== window) {
          // logs.push('Closing popup window after successful auth (NextAuth)');
          // console.log('Closing OAuth popup window (NextAuth)');
          window.close();
        } else {
          // PWAに戻る（ポップアップでない場合）
          const returnUrl = new URL(window.location.origin);
          returnUrl.pathname = '/dashboard';
          returnUrl.searchParams.set('pwa_bridge_success', 'true');
          returnUrl.searchParams.set('pwa_bridge_token', bridgeToken);

          // iOS PWAの場合、location.hrefで遷移
          window.location.href = returnUrl.toString();
        }
      } else if (status === 'unauthenticated') {
        // logs.push('❌ Authentication failed - no session after retries');
        // logs.push(`Total retries: ${retryCount}`);

        // すべてのログをコンソールに出力（失敗時）
        // console.error('=== PWA OAuth Failed Debug ===');
        // logs.forEach(log => // console.error(log));

        // ポップアップウィンドウの場合は、Cache APIにエラーを保存して閉じる
        if (window.opener && window.opener !== window) {
          await authBridge.saveAuthToken({
            token: bridgeToken || '',
            provider: 'error',
            callbackUrl: '/auth/signin',
            userData: {
              id: '',
              name: '',
              email: '',
              image: null
            }
          });
          window.close();
        } else {
          // 認証失敗
          const returnUrl = new URL(window.location.origin);
          returnUrl.pathname = '/auth/signin';
          returnUrl.searchParams.set('error', 'OAuth認証に失敗しました');

          window.location.href = returnUrl.toString();
        }
      }

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

      </div>
    </div>
  );
}