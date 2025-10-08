import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// OAuth profile interface
interface OAuthProfile {
  sub?: string;
  picture?: string;
  email?: string;
  name?: string;
}

export async function POST(request: Request) {
  try {
    const { user, profile, account } = await request.json();

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const email = user.email.toLowerCase();

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'このメールアドレスは既に登録されています'
      });
    }

    // 新規ユーザー作成
    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7日間の無料トライアル

    const newUser = await prisma.user.create({
      data: {
        name: user.name || email.split('@')[0],
        email: email,
        password: null,
        subscriptionStatus: 'trial',
        trialEndsAt,
        emailVerified: new Date(),
        image: (profile as OAuthProfile)?.picture || null,
      },
    });

    // Googleアカウント連携
    await prisma.account.create({
      data: {
        userId: newUser.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: profile?.sub || user.id,
        access_token: account?.access_token || '',
        token_type: account?.token_type || 'bearer',
        id_token: account?.id_token || undefined,
        scope: account?.scope || undefined,
        expires_at: account?.expires_at || undefined,
        refresh_token: account?.refresh_token || undefined,
      },
    });

    // デフォルト設定を作成
    await prisma.userSettings.create({
      data: {
        userId: newUser.id,
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

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      }
    });
  } catch (error) {
    console.error('Google signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}