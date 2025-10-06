export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@kigasuru.com',
      to: email,
      subject: 'メールアドレスの確認',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>メールアドレスの確認</h2>
          <p>以下のリンクをクリックして、メールアドレスを確認してください。</p>
          <p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px;">
              メールアドレスを確認
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            このリンクは24時間有効です。<br>
            このメールに心当たりがない場合は、無視してください。
          </p>
        </div>
      `,
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
