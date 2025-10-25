import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/subscription/cancel-request
 * サブスクリプション解約申請を作成
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { reason } = await req.json();

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: {
            status: 'active',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // アクティブなサブスクリプションがあるか確認
    if (user.subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'アクティブなサブスクリプションがありません' },
        { status: 400 }
      );
    }

    // 既に解約申請済みか確認
    const existingRequest = await prisma.cancellationRequest.findFirst({
      where: {
        userId: user.id,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: '既に解約申請が処理待ちです' },
        { status: 400 }
      );
    }

    // 解約申請を作成
    const cancellationRequest = await prisma.cancellationRequest.create({
      data: {
        userId: user.id,
        reason: reason || null,
        status: 'pending',
      },
    });

    // 管理者にメール通知を送信（非同期、エラーがあっても無視）
    sendCancellationNotificationEmail({
      userName: user.name || user.email,
      userEmail: user.email,
      reason: reason || '理由の記載なし',
      subscriptionPlan: user.subscriptions[0]?.plan || 'unknown',
      createdAt: cancellationRequest.createdAt,
    }).catch((error) => {
      console.error('[Cancel Request] Failed to send email:', error);
    });

    return NextResponse.json({
      success: true,
      request: cancellationRequest,
    });
  } catch (error) {
    console.error('[Cancel Request API] Error:', error);
    return NextResponse.json(
      { error: '解約申請の作成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 解約申請通知メールを管理者に送信
 */
async function sendCancellationNotificationEmail(data: {
  userName: string;
  userEmail: string;
  reason: string;
  subscriptionPlan: string;
  createdAt: Date;
}): Promise<void> {
  const { userName, userEmail, reason, subscriptionPlan, createdAt } = data;

  const formattedDate = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(createdAt);

  const planLabel = subscriptionPlan === 'monthly' ? '月額プラン' : subscriptionPlan === 'yearly' ? '年額プラン' : subscriptionPlan;

  const subject = '【上手くなる気がするぅぅぅ】サブスクリプション解約申請';

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
    .reason-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 サブスクリプション解約申請</h1>
    </div>
    <div class="content">
      <p>管理者様</p>
      <p>ユーザーからサブスクリプションの解約申請がありました。</p>

      <div class="info-box">
        <div class="info-label">申請日時</div>
        <div class="info-value">${formattedDate}</div>
      </div>

      <div class="info-box">
        <div class="info-label">ユーザー名</div>
        <div class="info-value">${userName}</div>
      </div>

      <div class="info-box">
        <div class="info-label">メールアドレス</div>
        <div class="info-value">${userEmail}</div>
      </div>

      <div class="info-box">
        <div class="info-label">契約プラン</div>
        <div class="info-value">${planLabel}</div>
      </div>

      <div class="reason-box">
        <div class="info-label">解約理由</div>
        <div class="info-value">${reason}</div>
      </div>

      <p>管理画面から解約処理を実施してください。</p>
    </div>
    <div class="footer">
      <p>© 2025 上手くなる気がするぅぅぅ by Senrigan Inc.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
【上手くなる気がするぅぅぅ】サブスクリプション解約申請

管理者様

ユーザーからサブスクリプションの解約申請がありました。

申請日時: ${formattedDate}
ユーザー名: ${userName}
メールアドレス: ${userEmail}
契約プラン: ${planLabel}

解約理由:
${reason}

管理画面から解約処理を実施してください。

---
© 2025 上手くなる気がするぅぅぅ by Senrigan Inc.
  `;

  // 管理者のメールアドレス（環境変数から取得）
  const adminEmail = process.env.ADMIN_EMAIL || 'miyagawakiyomi@gmail.com';

  await sendEmail({
    to: [adminEmail],
    subject,
    html,
  });
}
