export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/trial/check
 * トライアルユーザーの使用状況をチェック
 * - 記録済みのユニーク日付数を返す
 * - 3日分を超えているかを判定
 */
export async function GET() {
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
        isTrialUser: false,
        canRecord: true,
        uniqueDatesUsed: 0,
        trialDaysLimit: 3,
        daysRemaining: 0,
      });
    }

    // ユーザーの全ショットから異なる日付（日付部分のみ）を取得
    const shots = await prisma.shot.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'asc' },
    });

    // ユニークな日付（YYYY-MM-DD形式）を抽出
    const uniqueDates = new Set(
      shots.map((shot) => {
        const date = new Date(shot.date);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      })
    );

    const uniqueDatesUsed = uniqueDates.size;
    const trialDaysLimit = 3;
    const daysRemaining = Math.max(0, trialDaysLimit - uniqueDatesUsed);
    const canRecord = uniqueDatesUsed < trialDaysLimit;

    return NextResponse.json({
      isTrialUser: true,
      canRecord,
      uniqueDatesUsed,
      trialDaysLimit,
      daysRemaining,
      usedDates: Array.from(uniqueDates).sort(),
    });
  } catch (error) {
    console.error('[Trial Check API] Error:', error);
    return NextResponse.json(
      { error: 'トライアル状況の確認に失敗しました' },
      { status: 500 }
    );
  }
}
