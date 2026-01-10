export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/trial/validate
 * トライアルユーザーが新しい日付で記録可能かチェック
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const subscriptionStatus = session.user.subscriptionStatus;

    // トライアルユーザー以外はチェック不要
    if (subscriptionStatus !== 'trial') {
      return NextResponse.json({
        canRecord: true,
        isNewDate: false,
        reason: 'サブスクリプションユーザー',
      });
    }

    const { shotDate } = await request.json();

    if (!shotDate) {
      return NextResponse.json(
        { error: '記録日付が必要です' },
        { status: 400 }
      );
    }

    // 記録しようとしている日付（YYYY-MM-DD）
    const newDate = new Date(shotDate).toISOString().split('T')[0];

    // ユーザーの全ショットから異なる日付を取得
    const shots = await prisma.shot.findMany({
      where: { userId },
      select: { date: true },
    });

    // ユニークな日付（YYYY-MM-DD形式）を抽出
    const uniqueDates = new Set(
      shots.map((shot) => {
        const date = new Date(shot.date);
        return date.toISOString().split('T')[0];
      })
    );

    // 新しい日付での記録かどうか
    const isNewDate = !uniqueDates.has(newDate);
    const uniqueDatesUsed = uniqueDates.size;
    const trialDaysLimit = 3;

    // 既存の日付なら記録可能
    if (!isNewDate) {
      return NextResponse.json({
        canRecord: true,
        isNewDate: false,
        uniqueDatesUsed,
        trialDaysLimit,
        reason: '既存の日付での記録',
      });
    }

    // 新しい日付で、まだ制限に達していない場合は記録可能
    if (uniqueDatesUsed < trialDaysLimit) {
      return NextResponse.json({
        canRecord: true,
        isNewDate: true,
        uniqueDatesUsed,
        trialDaysLimit,
        daysRemaining: trialDaysLimit - uniqueDatesUsed - 1, // 今回の記録後の残り
        reason: `トライアル${uniqueDatesUsed + 1}日目の記録`,
      });
    }

    // 新しい日付で、既に制限に達している場合は記録不可
    return NextResponse.json({
      canRecord: false,
      isNewDate: true,
      uniqueDatesUsed,
      trialDaysLimit,
      daysRemaining: 0,
      reason: 'トライアル期間の記録日数上限に達しました',
      message: 'トライアル期間では3日分の記録が可能です。続けてご利用いただくには、サブスクリプションをご購入ください。',
    });
  } catch (error) {
    console.error('[Trial Validate API] Error:', error);
    return NextResponse.json(
      { error: 'トライアル検証に失敗しました' },
      { status: 500 }
    );
  }
}
