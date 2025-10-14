import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

/**
 * お問い合わせフォーム送信API
 */
export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    // バリデーション
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // メールアドレスの半角英数字チェック
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'メールアドレスは半角英数字で入力してください' },
        { status: 400 }
      );
    }

    // HTMLメールテンプレート
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #286300; border-bottom: 2px solid #286300; padding-bottom: 10px; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>お問い合わせがありました</h2>
            <div class="field">
              <div class="label">お名前:</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">メールアドレス:</div>
              <div class="value">${email}</div>
            </div>
            <div class="field">
              <div class="label">お問い合わせ内容:</div>
              <div class="value">${message.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // メール送信
    try {
      await sendEmail({
        to: ['support@kigasuru.com'],
        subject: `【お問い合わせ】${name}様より`,
        html: htmlContent,
      });

      console.log('[Contact API] Email sent successfully:', { name, email });
    } catch (emailError) {
      console.error('[Contact API] Email send error:', emailError);
      // メール送信エラーの場合は、より具体的なエラーメッセージを返す
      return NextResponse.json(
        { error: 'メールの送信に失敗しました。時間をおいて再度お試しください。' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'お問い合わせを受け付けました' });
  } catch (error) {
    console.error('[Contact API] Error:', error);
    return NextResponse.json(
      { error: 'お問い合わせの送信に失敗しました' },
      { status: 500 }
    );
  }
}
