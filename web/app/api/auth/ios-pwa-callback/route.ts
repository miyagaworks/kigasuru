import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// iOS PWA OAuth認証のコールバック処理
// cookieに依存せず、直接認証処理を行う

async function exchangeCodeForTokens(code: string, provider: string, redirectUri: string) {
  if (provider === 'line') {
    const tokenUrl = 'https://api.line.me/oauth2/v2.1/token';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINE_CHANNEL_ID!,
      client_secret: process.env.LINE_CHANNEL_SECRET!,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LINE token exchange failed: ${error}`);
    }

    const tokens = await response.json();

    // ID Token をデコードしてユーザー情報を取得
    const idToken = tokens.id_token;
    const decoded = jwt.decode(idToken) as { sub: string; name?: string; picture?: string };

    return {
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      profile: {
        sub: decoded.sub,
        name: decoded.name,
        picture: decoded.picture,
      }
    };
  } else if (provider === 'google') {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google token exchange failed: ${error}`);
    }

    const tokens = await response.json();

    // ユーザー情報を取得
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userInfo = await userInfoResponse.json();

    return {
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      profile: {
        sub: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      }
    };
  }

  throw new Error('Invalid provider');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // パラメータを取得
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const provider = searchParams.get('provider');
  const bridgeToken = searchParams.get('bridge_token');
  const callbackUrl = searchParams.get('callback_url') || '/dashboard';

  // エラーチェック
  if (error) {
    console.error('OAuth error:', error, searchParams.get('error_description'));
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state || !provider || !bridgeToken) {
    return NextResponse.redirect(
      new URL('/auth/signin?error=Missing required parameters', request.url)
    );
  }

  try {
    // 認証コードをアクセストークンに交換
    const redirectUri = new URL('/api/auth/ios-pwa-callback', request.url);
    redirectUri.searchParams.set('provider', provider);
    redirectUri.searchParams.set('bridge_token', bridgeToken);
    redirectUri.searchParams.set('callback_url', callbackUrl);
    redirectUri.searchParams.set('state', state);

    const authData = await exchangeCodeForTokens(code, provider, redirectUri.toString());

    // ユーザー作成または更新
    let user;
    if (provider === 'line') {
      // LINE認証の場合
      user = await prisma.user.findUnique({
        where: { lineUserId: authData.profile.sub },
      });

      if (!user) {
        // 新規ユーザー作成
        const email = `line_${authData.profile.sub}@kigasuru.com`;
        const now = new Date();
        const trialEndsAt = new Date(now);
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        user = await prisma.user.create({
          data: {
            name: authData.profile.name || email.split('@')[0],
            email: email,
            password: null,
            subscriptionStatus: 'trial',
            trialEndsAt,
            emailVerified: new Date(),
            lineUserId: authData.profile.sub,
            image: authData.profile.picture || null,
          },
        });

        // アカウント情報を保存
        await prisma.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider: 'line',
            providerAccountId: authData.profile.sub,
            access_token: authData.access_token,
            token_type: 'bearer',
            id_token: authData.id_token,
            expires_at: Math.floor(authData.expires_at / 1000),
            refresh_token: authData.refresh_token,
          },
        });

        // デフォルト設定を作成
        await prisma.userSettings.create({
          data: {
            userId: user.id,
            enabledFields: {
              slope: true,
              lie: true,
              club: true,
              strength: true,
              wind: true,
              temperature: true,
              feeling: true,
              memo: true,
            },
            clubs: ['DR', '3W', '5W', '7W', 'U4', 'U5', '5I', '6I', '7I', '8I', '9I', 'PW', '50', '52', '54', '56', '58'],
          },
        });
      }
    } else if (provider === 'google') {
      // Google認証の場合
      const email = authData.profile.email?.toLowerCase();
      if (!email) {
        throw new Error('Google account email is required');
      }

      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // 新規ユーザー作成
        const now = new Date();
        const trialEndsAt = new Date(now);
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        user = await prisma.user.create({
          data: {
            name: authData.profile.name || email.split('@')[0],
            email: email,
            password: null,
            subscriptionStatus: 'trial',
            trialEndsAt,
            emailVerified: new Date(),
            image: authData.profile.picture || null,
          },
        });

        // アカウント情報を保存
        await prisma.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: authData.profile.sub,
            access_token: authData.access_token,
            token_type: 'bearer',
            id_token: authData.id_token,
            expires_at: Math.floor(authData.expires_at / 1000),
            refresh_token: authData.refresh_token,
          },
        });

        // デフォルト設定を作成
        await prisma.userSettings.create({
          data: {
            userId: user.id,
            enabledFields: {
              slope: true,
              lie: true,
              club: true,
              strength: true,
              wind: true,
              temperature: true,
              feeling: true,
              memo: true,
            },
            clubs: ['DR', '3W', '5W', '7W', 'U4', 'U5', '5I', '6I', '7I', '8I', '9I', 'PW', '50', '52', '54', '56', '58'],
          },
        });
      } else {
        // 既存アカウントの画像を更新
        if (!user.image && authData.profile.picture) {
          await prisma.user.update({
            where: { id: user.id },
            data: { image: authData.profile.picture },
          });
        }
      }
    }

    if (!user) {
      throw new Error('User creation/lookup failed');
    }

    // PWAコールバックページへリダイレクト（ユーザー情報付き）
    const returnUrl = new URL('/auth/pwa-callback', request.url);
    returnUrl.searchParams.set('pwa_bridge_token', bridgeToken);
    returnUrl.searchParams.set('provider', provider);
    returnUrl.searchParams.set('status', 'success');
    // ユーザー情報をURLパラメータで渡す（NextAuthのJWE形式ではなく）
    returnUrl.searchParams.set('user_id', user.id);
    returnUrl.searchParams.set('user_name', encodeURIComponent(user.name || ''));
    returnUrl.searchParams.set('user_email', encodeURIComponent(user.email));
    if (user.image) {
      returnUrl.searchParams.set('user_image', encodeURIComponent(user.image));
    }

    return NextResponse.redirect(returnUrl);
  } catch (error) {
    console.error('iOS PWA OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error instanceof Error ? error.message : 'OAuth callback failed')}`, request.url)
    );
  }
}