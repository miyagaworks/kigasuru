// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { sendEmail, getLogoAttachment } from '@/lib/email';
import { getEmailVerificationTemplate } from '@/lib/email/templates/email-verification';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 });
    }

    // メールアドレスの正規化
    const normalizedEmail = email.toLowerCase();

    // 既に登録済みのユーザーがいないかチェック
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 },
      );
    }

    // 既存の仮登録があれば削除
    await prisma.pendingRegistration.deleteMany({
      where: { email: normalizedEmail },
    });

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // 認証トークン生成（24時間有効）
    const token = crypto.randomUUID();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    // 仮登録データを作成
    await prisma.pendingRegistration.create({
      data: {
        name,
        email: normalizedEmail,
        hashedPassword,
        token,
        expires,
      },
    });

    // 認証メール送信
    const baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    const { html } = getEmailVerificationTemplate({
      verificationUrl,
      email: normalizedEmail,
    });

    const logoAttachment = getLogoAttachment();
    const attachments = logoAttachment ? [logoAttachment] : undefined;

    await sendEmail({
      to: [normalizedEmail],
      subject: 'Kigasuru - メールアドレスの確認',
      html,
      attachments,
    });

    return NextResponse.json(
      {
        message: '登録完了メールを送信しました。メールを確認して認証を完了してください。',
        email: normalizedEmail,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '登録処理中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
