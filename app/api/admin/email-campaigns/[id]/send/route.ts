import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { sendBulkEmail } from '@/lib/email';
import { isAdmin } from '@/lib/admin';

/**
 * メールキャンペーン送信
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者チェック
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const { id } = await params;

    // キャンペーン取得
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'キャンペーンが見つかりません' },
        { status: 404 }
      );
    }

    // 既に送信済みの場合はエラー
    if (campaign.status === 'sent') {
      return NextResponse.json(
        { error: 'このキャンペーンは既に送信済みです' },
        { status: 400 }
      );
    }

    // 配信対象のユーザーを取得
    let whereClause: { subscriptionStatus?: string } = {};

    switch (campaign.targetType) {
      case 'trial':
        whereClause = { subscriptionStatus: 'trial' };
        break;
      case 'active':
        whereClause = { subscriptionStatus: 'active' };
        break;
      case 'permanent':
        whereClause = { subscriptionStatus: 'permanent' };
        break;
      case 'all':
      default:
        // 全ユーザー
        whereClause = {};
        break;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { email: true },
    });

    const recipients = users.map((user) => user.email);

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: '配信対象のユーザーが見つかりません' },
        { status: 400 }
      );
    }

    // ステータスを送信中に更新
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'sending',
        totalRecipients: recipients.length,
      },
    });

    // バルクメール送信
    const results = await sendBulkEmail({
      recipients,
      subject: campaign.subject,
      html: campaign.content,
    });

    // 結果を保存
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: results.failed > 0 ? 'failed' : 'sent',
        sentCount: results.success,
        failedCount: results.failed,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      totalRecipients: recipients.length,
      sentCount: results.success,
      failedCount: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('[Email Campaign Send API] Error:', error);

    // エラー時はステータスをfailedに更新
    const { id } = await params;
    try {
      await prisma.emailCampaign.update({
        where: { id },
        data: { status: 'failed' },
      });
    } catch (updateError) {
      console.error('[Email Campaign Send API] Update Error:', updateError);
    }

    return NextResponse.json(
      { error: 'メール送信に失敗しました' },
      { status: 500 }
    );
  }
}
