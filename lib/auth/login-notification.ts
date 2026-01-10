// lib/auth/login-notification.ts
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email';

interface LoginEventData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * ログインイベントを記録し、必要に応じてメール通知を送信
 */
export async function recordLoginEvent(data: LoginEventData): Promise<void> {
  try {
    const { userId, ipAddress, userAgent } = data;

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
      },
    });

    if (!user) {
      console.error('[recordLoginEvent] User not found:', userId);
      return;
    }

    // デバイス情報を解析
    const deviceInfo = parseUserAgent(userAgent);

    // IPアドレスから位置情報を取得（簡易版）
    const location = await getLocationFromIP(ipAddress);

    // ログインイベントを記録
    const loginEvent = await prisma.loginEvent.create({
      data: {
        userId,
        ipAddress,
        userAgent,
        location,
        deviceInfo,
        notified: false,
      },
    });

    // 過去24時間以内に同じIPアドレスからのログインがあるか確認
    const recentLogin = await prisma.loginEvent.findFirst({
      where: {
        userId,
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          lt: loginEvent.createdAt,
        },
      },
    });

    // 新しいIPアドレスからのログインの場合、メール通知を送信
    if (!recentLogin && ipAddress) {
      await sendLoginNotificationEmail({
        email: user.email,
        name: user.name || 'ユーザー',
        ipAddress,
        location,
        deviceInfo,
        timestamp: loginEvent.createdAt,
      });

      // 通知済みフラグを更新
      await prisma.loginEvent.update({
        where: { id: loginEvent.id },
        data: { notified: true },
      });
    }
  } catch (error) {
    console.error('[recordLoginEvent] Error:', error);
    // エラーが発生してもログインプロセスは継続
  }
}

/**
 * ログイン通知メールを送信
 */
async function sendLoginNotificationEmail(data: {
  email: string;
  name: string;
  ipAddress: string;
  location: string | null;
  deviceInfo: string | null;
  timestamp: Date;
}): Promise<void> {
  const { email, name, ipAddress, location, deviceInfo, timestamp } = data;

  const formattedDate = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(timestamp);

  const subject = '【上手くなる気がするぅぅぅ】新しいログインを検知しました';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2d5a3d 0%, #4a7c59 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; border-left: 4px solid #2d5a3d; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .info-label { font-weight: bold; color: #2d5a3d; margin-bottom: 5px; }
    .info-value { color: #555; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 新しいログインを検知</h1>
    </div>
    <div class="content">
      <p>こんにちは、${name}さん</p>
      <p>あなたのアカウントで新しいログインが検知されました。</p>

      <div class="info-box">
        <div class="info-label">ログイン日時</div>
        <div class="info-value">${formattedDate}</div>
      </div>

      <div class="info-box">
        <div class="info-label">IPアドレス</div>
        <div class="info-value">${ipAddress}</div>
      </div>

      ${location ? `
      <div class="info-box">
        <div class="info-label">場所</div>
        <div class="info-value">${location}</div>
      </div>
      ` : ''}

      ${deviceInfo ? `
      <div class="info-box">
        <div class="info-label">デバイス</div>
        <div class="info-value">${deviceInfo}</div>
      </div>
      ` : ''}

      <div class="warning">
        ⚠️ このログインに心当たりがない場合は、すぐにパスワードを変更し、サポートまでご連絡ください。
      </div>

      <p>このメールは、あなたのアカウントのセキュリティを保護するために自動送信されています。</p>
    </div>
    <div class="footer">
      <p>© 2025 上手くなる気がするぅぅぅ by Senrigan Inc.</p>
      <p>このメールに心当たりがない場合は、support@kigasuru.com までお問い合わせください。</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
【上手くなる気がするぅぅぅ】新しいログインを検知しました

こんにちは、${name}さん

あなたのアカウントで新しいログインが検知されました。

ログイン日時: ${formattedDate}
IPアドレス: ${ipAddress}
${location ? `場所: ${location}` : ''}
${deviceInfo ? `デバイス: ${deviceInfo}` : ''}

このログインに心当たりがない場合は、すぐにパスワードを変更し、サポートまでご連絡ください。

---
© 2025 上手くなる気がするぅぅぅ by Senrigan Inc.
  `;

  await sendEmail({
    to: [email],
    subject,
    html,
  });
}

/**
 * User-Agentからデバイス情報を解析
 */
function parseUserAgent(userAgent?: string): string | null {
  if (!userAgent) return null;

  try {
    // 簡易的なUser-Agent解析
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    // OS検出
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('iPhone')) os = 'iPhone';
    else if (userAgent.includes('iPad')) os = 'iPad';
    else if (userAgent.includes('Android')) os = 'Android';

    // ブラウザ検出
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edg')) browser = 'Edge';

    return `${os} - ${browser}`;
  } catch (error) {
    console.error('[parseUserAgent] Error:', error);
    return null;
  }
}

/**
 * IPアドレスから位置情報を取得（簡易版）
 * 本番環境ではIP geolocation APIを使用することを推奨
 */
async function getLocationFromIP(ipAddress?: string): Promise<string | null> {
  if (!ipAddress) return null;

  // ローカルIPの場合
  if (ipAddress === '::1' || ipAddress.startsWith('127.') || ipAddress.startsWith('192.168.')) {
    return 'ローカル環境';
  }

  try {
    // 無料のIP geolocation API（ip-api.com）を使用
    // 本番環境では有料の信頼性の高いAPIを使用することを推奨
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?lang=ja`, {
      signal: AbortSignal.timeout(3000), // 3秒でタイムアウト
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.status === 'success') {
      return `${data.country || ''}, ${data.city || ''}`.trim().replace(/, $/, '');
    }

    return null;
  } catch (error) {
    console.error('[getLocationFromIP] Error:', error);
    return null;
  }
}

/**
 * 古いログインイベントをクリーンアップ（定期実行推奨）
 */
export async function cleanupOldLoginEvents(daysToKeep: number = 90): Promise<number> {
  try {
    const oldDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const result = await prisma.loginEvent.deleteMany({
      where: {
        createdAt: {
          lt: oldDate,
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error('[cleanupOldLoginEvents] Error:', error);
    return 0;
  }
}
