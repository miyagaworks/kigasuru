// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email';
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

    console.log('[Register] Pending registration created:', { email: normalizedEmail, token });

    // 認証メール送信（失敗してもユーザー登録は成功とする）
    const baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    let emailSent = false;
    let emailError: string | null = null;

    try {
      // 本番環境のロゴURL（HTTPSで参照）
      const logoUrl = `${baseUrl}/assets/images/logo_w.png`;

      const { html } = getEmailVerificationTemplate({
        verificationUrl,
        email: normalizedEmail,
        logoUrl,
      });

      const result = await sendEmail({
        to: [normalizedEmail],
        subject: '【気がするぅぅぅ】メールアドレスの確認',
        html,
      });

      if (result.success) {
        emailSent = true;
        console.log('[Register] Email sent successfully to:', normalizedEmail);
      } else {
        emailError = 'Email send failed';
        console.error('[Register] Email send failed:', result);
      }
    } catch (error) {
      emailError = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Register] Email error:', error);
    }

    return NextResponse.json(
      {
        message: emailSent
          ? '登録完了メールを送信しました。メールを確認して認証を完了してください。'
          : 'アカウントを作成しましたが、メールの送信に失敗しました。サポートにお問い合わせください。',
        email: normalizedEmail,
        emailSent,
        requiresEmailVerification: true,
        ...(emailError && { emailError }),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[Register] Registration error:', error);
    return NextResponse.json(
      { error: '登録処理中にエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
