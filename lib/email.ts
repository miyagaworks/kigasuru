import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// ビルド時に環境変数がない場合はダミー値を使用
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

export interface SendEmailOptions {
  to: string[];
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    cid?: string;
  }>;
}

/**
 * メールを送信
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = '上手くなる気がするぅぅぅ <noreply@kigasuru.com>',
  attachments,
}: SendEmailOptions) {
  // 環境変数チェック
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-build') {
    console.error('[Send Email] RESEND_API_KEY is not configured properly');
    throw new Error('RESEND_API_KEY is not configured');
  }

  // 開発環境ではResendのデフォルトアドレスを使用（ドメイン認証不要）
  const isProduction = process.env.NODE_ENV === 'production';
  const actualFrom = isProduction ? from : 'onboarding@resend.dev';

  try {
    console.log('[Send Email] Attempting to send email:', {
      to,
      subject,
      from: actualFrom,
      environment: process.env.NODE_ENV,
    });

    const result = await resend.emails.send({
      from: actualFrom,
      to,
      subject,
      html,
      attachments,
    });

    // Resend APIはエラーを返すことがある
    if ('error' in result && result.error) {
      console.error('[Send Email] Resend API error:', result.error);
      throw new Error(`Resend API error: ${JSON.stringify(result.error)}`);
    }

    console.log('[Send Email] Success:', result);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('[Send Email] Error:', error);
    throw error;
  }
}

/**
 * ロゴ画像を読み込んで添付ファイルとして返す
 */
export function getLogoAttachment() {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'images', 'logo_w.png');
    const logoBuffer = fs.readFileSync(logoPath);

    return {
      filename: 'logo.png',
      content: logoBuffer,
      cid: 'logo', // HTMLで cid:logo として参照可能
    };
  } catch (error) {
    console.error('[Get Logo] Error:', error);
    return null;
  }
}

/**
 * ロゴ画像をBase64エンコードして返す
 */
export function getLogoBase64() {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'images', 'logo_w.png');
    const logoBuffer = fs.readFileSync(logoPath);
    const base64 = logoBuffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('[Get Logo Base64] Error:', error);
    return null;
  }
}

/**
 * バルクメール送信（複数の宛先に個別送信）
 */
export async function sendBulkEmail({
  recipients,
  subject,
  html,
  from = '上手くなる気がするぅぅぅ <noreply@kigasuru.com>',
}: {
  recipients: string[];
  subject: string;
  html: string;
  from?: string;
}) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>,
  };

  // バッチ処理（10件ずつ）
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (email) => {
        try {
          await resend.emails.send({
            from,
            to: [email],
            subject,
            html,
          });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            email,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      })
    );

    // レート制限対策のため少し待つ
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
