export interface EmailVerificationTemplateProps {
  verificationUrl: string;
  email: string;
}

export function getEmailVerificationTemplate({
  verificationUrl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  email: _email,
}: EmailVerificationTemplateProps) {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>メールアドレスの確認</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Kigasuru</h1>
  </div>

  <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">メールアドレスの確認</h2>

    <p>Kigasuruにご登録いただきありがとうございます。</p>

    <p>以下のボタンをクリックして、メールアドレスの確認を完了してください：</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
        メールアドレスを確認
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">ボタンをクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：</p>
    <p style="color: #667eea; word-break: break-all; font-size: 14px;">${verificationUrl}</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; margin-bottom: 0;">
      このメールに心当たりがない場合は、無視していただいて問題ありません。<br>
      このリンクは24時間後に無効になります。
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Kigasuru. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Kigasuruにご登録いただきありがとうございます。

メールアドレスの確認を完了するには、以下のURLをクリックしてください：

${verificationUrl}

このメールに心当たりがない場合は、無視していただいて問題ありません。
このリンクは24時間後に無効になります。

© ${new Date().getFullYear()} Kigasuru. All rights reserved.
  `.trim();

  return { html, text };
}
