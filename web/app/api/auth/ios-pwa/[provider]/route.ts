import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// iOS PWA専用のOAuth認証ハンドラー
// cookieに依存せず、URLパラメータでstateを管理

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;

  // PWAブリッジトークンを取得
  const bridgeToken = searchParams.get('bridge_token');
  const callbackUrl = searchParams.get('callback_url') || '/dashboard';

  if (!bridgeToken) {
    return NextResponse.redirect(
      new URL(`/auth/signin?error=Missing bridge token`, request.url)
    );
  }

  try {
    // ランダムなstateを生成（cookieではなくURLパラメータで管理）
    const state = crypto.randomBytes(32).toString('base64url');

    // カスタムコールバックURLを構築
    const customCallbackUrl = new URL('/api/auth/ios-pwa-callback', request.url);
    customCallbackUrl.searchParams.set('provider', provider);
    customCallbackUrl.searchParams.set('bridge_token', bridgeToken);
    customCallbackUrl.searchParams.set('callback_url', callbackUrl);
    customCallbackUrl.searchParams.set('state', state);

    // OAuthプロバイダーのURLを構築
    let authUrl: URL;

    if (provider === 'line') {
      authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', process.env.LINE_CHANNEL_ID!);
      authUrl.searchParams.set('redirect_uri', customCallbackUrl.toString());
      authUrl.searchParams.set('scope', 'profile openid');
      authUrl.searchParams.set('state', state);
    } else if (provider === 'google') {
      authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', customCallbackUrl.toString());
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('prompt', 'select_account');
      authUrl.searchParams.set('access_type', 'offline');
    } else {
      return NextResponse.redirect(
        new URL(`/auth/signin?error=Invalid provider`, request.url)
      );
    }

    // OAuthプロバイダーへリダイレクト
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('iOS PWA OAuth init error:', error);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=OAuth initialization failed`, request.url)
    );
  }
}