export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin';

/**
 * GET /api/admin/users
 * 全ユーザー一覧を取得（管理者のみ）
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    // ユーザー一覧を取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        updatedAt: true,
        shots: {
          select: {
            date: true,
          },
        },
        _count: {
          select: {
            shots: true,
            subscriptions: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 各ユーザーのトライアル使用日数を計算
    const usersWithTrialUsage = users.map((user) => {
      let trialDaysUsed = 0;

      // トライアルユーザーの場合のみ計算
      if (user.subscriptionStatus === 'trial') {
        // ユニークな日付（YYYY-MM-DD）を抽出
        const uniqueDates = new Set(
          user.shots.map((shot) => {
            const date = new Date(shot.date);
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
          })
        );
        trialDaysUsed = uniqueDates.size;
      }

      // shots配列は返さない（サイズが大きいため）
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { shots, ...userWithoutShots } = user;

      return {
        ...userWithoutShots,
        trialDaysUsed,
      };
    });

    return NextResponse.json({
      success: true,
      users: usersWithTrialUsage,
      total: usersWithTrialUsage.length,
    });
  } catch (error) {
    console.error('[Admin Users API] Error:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
