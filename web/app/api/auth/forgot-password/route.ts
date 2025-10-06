export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email';
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

    // メール送信
    const { html, text } = getPasswordResetTemplate({
      resetUrl,
      email: user.email,
    });

    await sendEmail({
      to: [user.email],
      subject: 'Kigasuru - パスワードリセットのご案内',
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

// パスワードリセットメールテンプレート
function getPasswordResetTemplate({ resetUrl, email }: { resetUrl: string; email: string }) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #4CAF50; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .warning { padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kigasuru</h1>
          </div>
          <div class="content">
            <h2>パスワードリセットのご案内</h2>
            <p>Kigasuruをご利用いただきありがとうございます。</p>
            <p>パスワードリセットのリクエストを受け付けました。<br>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">パスワードをリセットする</a>
            </div>
            <p>または、以下のURLをブラウザに貼り付けてアクセスしてください：</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            <div class="warning">
              <p style="margin: 0;"><strong>注意事項:</strong></p>
              <ul style="margin: 5px 0;">
                <li>このリンクは1時間のみ有効です</li>
                <li>心当たりがない場合は、このメールを無視してください</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>このメールは ${email} 宛に送信されました。</p>
            <p>&copy; 2025 Kigasuru. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Kigasuru - パスワードリセットのご案内

パスワードリセットのリクエストを受け付けました。
以下のURLにアクセスして、新しいパスワードを設定してください。

${resetUrl}

【注意事項】
• このリンクは1時間のみ有効です
• 心当たりがない場合は、このメールを無視してください

---
このメールは ${email} 宛に送信されました。
© 2025 Kigasuru. All rights reserved.
  `;

  return { html, text };
}
