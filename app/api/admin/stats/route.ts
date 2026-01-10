export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin';
import { cache } from '@/lib/cache';

/**
 * GET /api/admin/stats
 * 使用状況統計を取得（管理者のみ）
 * 5分間キャッシュ
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

    // キャッシュをチェック
    const cacheKey = 'admin:stats';
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        stats: cachedData,
        cached: true,
      });
    }

    // 各種統計を取得
    const [
      totalUsers,
      trialUsers,
      activeUsers,
      permanentUsers,
      totalShots,
      totalPayments,
      recentUsers,
    ] = await Promise.all([
      // 総ユーザー数
      prisma.user.count(),

      // トライアルユーザー数
      prisma.user.count({
        where: { subscriptionStatus: 'trial' },
      }),

      // アクティブユーザー数
      prisma.user.count({
        where: { subscriptionStatus: 'active' },
      }),

      // 永久利用権ユーザー数
      prisma.user.count({
        where: { subscriptionStatus: 'permanent' },
      }),

      // 総ショット数
      prisma.shot.count(),

      // 総支払い件数と金額
      prisma.payment.aggregate({
        _count: true,
        _sum: {
          amount: true,
        },
        where: {
          status: 'succeeded',
        },
      }),

      // 最近のユーザー（7日以内）
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // プラン別ユーザー数を取得
    const planDistribution = await prisma.subscription.groupBy({
      by: ['plan'],
      _count: true,
      where: {
        status: 'active',
      },
    });

    const stats = {
      users: {
        total: totalUsers,
        trial: trialUsers,
        active: activeUsers,
        permanent: permanentUsers,
        recent: recentUsers,
      },
      shots: {
        total: totalShots,
        averagePerUser: totalUsers > 0 ? Math.round(totalShots / totalUsers) : 0,
      },
      payments: {
        total: totalPayments._count,
        totalAmount: totalPayments._sum.amount || 0,
      },
      plans: planDistribution.map(p => ({
        plan: p.plan,
        count: p._count,
      })),
    };

    // キャッシュに保存（5分間）
    cache.set(cacheKey, stats, 300);

    return NextResponse.json({
      success: true,
      stats,
      cached: false,
    });
  } catch (error) {
    console.error('[Admin Stats API] Error:', error);
    return NextResponse.json(
      { error: '統計情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
