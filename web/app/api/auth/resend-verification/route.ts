export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, getLogoAttachment } from '@/lib/email';
import { getEmailVerificationTemplate } from '@/lib/email/templates/email-verification';

/**
 * POST /api/auth/resend-verification
 * 確認メールを再送信
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // ユーザーが存在するか確認
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // セキュリティ上、ユーザーが存在しない場合でも成功として返す
      return NextResponse.json({
        success: true,
        message: '確認メールを送信しました',
      });
    }

    // すでにメール確認済みの場合
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に確認済みです' },
        { status: 400 }
      );
    }

    // 検証トークンを作成
    const token = crypto.randomUUID();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24時間有効

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires,
      },
    });

    // 確認メールを送信
    const baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    const { html } = getEmailVerificationTemplate({
      verificationUrl,
      email: email.toLowerCase(),
    });

    const logoAttachment = getLogoAttachment();
    const attachments = logoAttachment ? [logoAttachment] : undefined;

    await sendEmail({
      to: [email],
      subject: 'Kigasuru - メールアドレスの確認',
      html,
      attachments,
    });

    return NextResponse.json({
      success: true,
      message: '確認メールを送信しました',
    });
  } catch (error) {
    console.error('[Resend Verification API] Error:', error);
    return NextResponse.json(
      { error: '確認メールの送信に失敗しました' },
      { status: 500 }
    );
  }
}
