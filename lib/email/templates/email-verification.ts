export interface EmailVerificationTemplateProps {
  verificationUrl: string;
  email: string;
  logoBase64?: string;
}

export function getEmailVerificationTemplate({
  verificationUrl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  email: _email,
  logoBase64,
}: EmailVerificationTemplateProps) {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>メールアドレスの確認</title>
  <style>
    /* ダークモード対策 - テキストを白に、ヘッダーとボタンの色を保持 */
    @media (prefers-color-scheme: dark) {
      .email-header {
        background: linear-gradient(to bottom, #286300 0%, #415a1d 50%, #609f00 100%) !important;
      }
      .email-button {
        background: linear-gradient(to bottom, #286300 0%, #415a1d 50%, #609f00 100%) !important;
        color: #ffffff !important;
      }
      .email-text {
        color: #ffffff !important;
      }
      .email-text-secondary {
        color: #cccccc !important;
      }
      .email-text-muted {
        color: #999999 !important;
      }
      .email-url-box {
        background: #2a2a2a !important;
        color: #86c232 !important;
      }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div class="email-header" style="background: linear-gradient(to bottom, #286300 0%, #415a1d 50%, #609f00 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
    ${logoBase64 ? `<img src="${logoBase64}" alt="上手くなる気がするぅぅぅ" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />` : '<div style="color: #ffffff; font-size: 32px; font-weight: bold;">上手くなる気がするぅぅぅ</div>'}
  </div>

  <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 class="email-text" style="color: #286300; margin-top: 0; font-size: 24px;">メールアドレスの確認</h2>

    <p class="email-text" style="font-size: 16px; color: #333;">上手くなる気がするぅぅぅにご登録いただきありがとうございます！</p>

    <p class="email-text" style="font-size: 16px; color: #333;">以下のボタンをクリックして、メールアドレスの確認を完了してください：</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" class="email-button"
         style="display: inline-block; background: linear-gradient(to bottom, #286300 0%, #415a1d 50%, #609f00 100%) !important; color: #ffffff !important; padding: 16px 48px; text-decoration: none !important; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(40, 99, 0, 0.2); mso-hide: all;">
        <span style="color: #ffffff !important; text-decoration: none !important;">メールアドレスを確認</span>
      </a>
    </div>

    <p class="email-text-secondary" style="color: #666; font-size: 14px;">ボタンをクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：</p>
    <p class="email-url-box" style="color: #415a1d; word-break: break-all; font-size: 14px; background: #f9f9f9; padding: 10px; border-radius: 5px;">${verificationUrl}</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

    <p class="email-text-muted" style="color: #999; font-size: 12px; margin-bottom: 0;">
      このメールに心当たりがない場合は、無視していただいて問題ありません。<br>
      このリンクは24時間後に無効になります。
    </p>
  </div>

  <div style="background: #ffffff; padding: 30px; margin-top: 20px; border-radius: 10px; border-left: 4px solid #609f00;">
    <p class="email-text" style="margin: 0 0 10px 0; color: #286300; font-weight: bold; font-size: 14px;">気がするぅぅぅチーム</p>
    <p class="email-text-secondary" style="margin: 0 0 5px 0; color: #666; font-size: 13px;">あなたのゴルフライフをサポートします</p>
    <p class="email-text-muted" style="margin: 0; color: #999; font-size: 12px;">スイングデータを記録・分析して、さらなる上達を目指しましょう！</p>
  </div>

  <div class="email-text-muted" style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} 上手くなる気がするぅぅぅ. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
上手くなる気がするぅぅぅにご登録いただきありがとうございます！

メールアドレスの確認を完了するには、以下のURLをクリックしてください：

${verificationUrl}

このメールに心当たりがない場合は、無視していただいて問題ありません。
このリンクは24時間後に無効になります。

---
気がするぅぅぅチーム
あなたのゴルフライフをサポートします
スイングデータを記録・分析して、さらなる上達を目指しましょう！

© ${new Date().getFullYear()} 上手くなる気がするぅぅぅ. All rights reserved.
  `.trim();

  return { html, text };
}
