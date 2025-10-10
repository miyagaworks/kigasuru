import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    // メール送信（Resendが設定されている場合）
    if (resend && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Kigasuru <noreply@kigasuru.com>',
          to: 'support@kigasuru.com',
          replyTo: email,
          subject: `【お問い合わせ】${name}様より`,
          html: `
            <h2>お問い合わせがありました</h2>
            <p><strong>お名前:</strong> ${name}</p>
            <p><strong>メールアドレス:</strong> ${email}</p>
            <p><strong>お問い合わせ内容:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // メール送信エラーでも処理は続行（ログには残す）
      }
    } else {
      // Resendが設定されていない場合は、コンソールにログを出力
      console.log('=== お問い合わせ ===');
      console.log('お名前:', name);
      console.log('メールアドレス:', email);
      console.log('お問い合わせ内容:', message);
      console.log('==================');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'お問い合わせの送信に失敗しました' },
      { status: 500 }
    );
  }
}
