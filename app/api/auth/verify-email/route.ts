import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'トークンが指定されていません' }, { status: 400 });
    }

    // 仮登録データを検証
    const pendingRegistration = await prisma.pendingRegistration.findUnique({
      where: { token },
    });

    if (!pendingRegistration) {
      return NextResponse.json(
        { error: '無効な認証トークンです' },
        { status: 400 },
      );
    }

    // トークンの有効期限をチェック
    if (pendingRegistration.expires < new Date()) {
      // 期限切れトークンを削除
      await prisma.pendingRegistration.delete({
        where: { id: pendingRegistration.id },
      });

      return NextResponse.json(
        { error: '認証トークンの有効期限が切れています。再度登録を行ってください。' },
        { status: 400 },
      );
    }

    // トランザクション内でユーザー作成と仮登録削除
    await prisma.$transaction(async (tx) => {
      // 7日間の無料トライアル
      const now = new Date();
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      // ユーザー作成（emailVerified を設定）
      const user = await tx.user.create({
        data: {
          name: pendingRegistration.name,
          email: pendingRegistration.email,
          password: pendingRegistration.hashedPassword,
          subscriptionStatus: 'trial',
          trialEndsAt,
          emailVerified: new Date(),
        },
      });

      // デフォルト設定を作成
      await tx.userSettings.create({
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
          clubs: [
            'DR',
            '3W',
            '5W',
            '7W',
            'U4',
            'U5',
            '5I',
            '6I',
            '7I',
            '8I',
            '9I',
            'PW',
            '50',
            '52',
            '54',
            '56',
            '58',
          ],
        },
      });

      // 仮登録データを削除
      await tx.pendingRegistration.delete({
        where: { id: pendingRegistration.id },
      });
    });

    // 認証完了ページにリダイレクト
    const baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/auth/verified`);
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'メール認証中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
