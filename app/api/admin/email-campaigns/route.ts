import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

/**
 * メールキャンペーン一覧取得
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者チェック
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('[Email Campaigns API] Error:', error);
    return NextResponse.json(
      { error: 'キャンペーン一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * メールキャンペーン作成
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者チェック
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const { title, subject, content, targetType, scheduledAt } = await req.json();

    // バリデーション
    if (!title || !subject || !content || !targetType) {
      return NextResponse.json(
        { error: 'タイトル、件名、本文、配信対象は必須です' },
        { status: 400 }
      );
    }

    const validTargetTypes = ['all', 'trial', 'active', 'permanent'];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: '無効な配信対象タイプです' },
        { status: 400 }
      );
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        title,
        subject,
        content,
        targetType,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: session.user.email,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error('[Email Campaigns API] Error:', error);
    return NextResponse.json(
      { error: 'キャンペーンの作成に失敗しました' },
      { status: 500 }
    );
  }
}
