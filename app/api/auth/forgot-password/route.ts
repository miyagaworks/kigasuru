export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email';
import { getPasswordResetTemplate } from '@/lib/email/templates/password-reset';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'メールアドレスが必要です' }, { status: 400 });
    }

    // ユーザーを検索（大文字小文字を区別しない）
    const user = await prisma.user.findFirst({
      where: {
        email: {
          mode: 'insensitive',
          equals: email,
        },
        password: { not: null }, // パスワード認証ユーザーのみ
      },
    });

    // ユーザーが見つからない場合でもセキュリティのため同じメッセージを返す
    if (!user) {
      return NextResponse.json(
        { message: 'パスワードリセット用のリンクをメールで送信しました' },
        { status: 200 },
      );
    }

    // リセットトークンの生成
    const resetToken = randomUUID();
    const expires = new Date(Date.now() + 3600 * 1000); // 1時間後

    // 既存のリセットトークンがあれば削除
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // 新しいリセットトークンを保存
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expires,
      },
    });

    // リセットリンクを生成
    const baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    // 本番環境のロゴURL（HTTPSで参照）
    const logoUrl = `${baseUrl}/assets/images/logo_w.png`;

    // メール送信
    const { html } = getPasswordResetTemplate({
      resetUrl,
      email: user.email,
      logoUrl,
    });

    await sendEmail({
      to: [user.email],
      subject: '【気がするぅぅぅ】パスワードリセットのご案内',
      html,
    });

    return NextResponse.json(
      { message: 'パスワードリセット用のリンクをメールで送信しました' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'パスワードリセット処理中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
