export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin';

/**
 * GET /api/admin/analytics
 * ユーザーごとの使用状況を取得（管理者のみ）
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('email'); // 'email'パラメータだが、名前とメールの両方で検索
    const userId = searchParams.get('userId');
    const detailUserId = searchParams.get('detailUserId'); // 詳細統計を取得するユーザーID

    // 新規ユーザー10人を取得
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            shots: true,
            subscriptions: true,
            payments: true,
          },
        },
        shots: {
          select: {
            id: true,
            date: true,
            club: true,
            distance: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        subscriptions: {
          select: {
            id: true,
            plan: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        },
      },
    });

    // 検索されたユーザーを取得
    let searchedUser = null;
    if (searchQuery || userId) {
      searchedUser = await prisma.user.findFirst({
        where: searchQuery
          ? {
              OR: [
                {
                  email: {
                    contains: searchQuery,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  name: {
                    contains: searchQuery,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : userId
            ? { id: userId }
            : undefined,
        include: {
          _count: {
            select: {
              shots: true,
              subscriptions: true,
              payments: true,
            },
          },
          shots: {
            select: {
              id: true,
              date: true,
              club: true,
              distance: true,
              result: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
          },
          subscriptions: {
            select: {
              id: true,
              plan: true,
              status: true,
              startDate: true,
              endDate: true,
            },
            orderBy: {
              startDate: 'desc',
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              plan: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    }

    // 詳細統計を取得
    let detailedStats = null;
    if (detailUserId) {
      const allShots = await prisma.shot.findMany({
        where: { userId: detailUserId },
        select: {
          id: true,
          club: true,
          distance: true,
          result: true,
          date: true,
        },
      });

      // クラブごとの統計を計算
      const clubStats: Record<string, {
        count: number;
        shotCount: number;
        totalDistance: number;
        distanceCount: number;
        avgDistance: number;
        totalDiff: number;
        diffCount: number;
        avgAccuracy: number;
        shots: Array<{ distance: number; accuracy: number; date: Date }>;
      }> = {};

      allShots.forEach((shot) => {
        if (!clubStats[shot.club]) {
          clubStats[shot.club] = {
            count: 0,
            shotCount: 0,
            totalDistance: 0,
            distanceCount: 0,
            avgDistance: 0,
            totalDiff: 0,
            diffCount: 0,
            avgAccuracy: 0,
            shots: [],
          };
        }

        const stats = clubStats[shot.club];
        stats.shotCount++;

        // 精度を計算（result から x, y を取得）
        if (shot.result && typeof shot.result === 'object') {
          const result = shot.result as { x?: number; y?: number };
          if (typeof result.x === 'number' && typeof result.y === 'number') {
            const x = result.x || 0;
            const y = result.y || 0;

            // 精度：ターゲットからのズレをYdで計算（ピタゴラスの定理）
            const diff = Math.round(Math.sqrt(x * x + y * y));
            stats.totalDiff += diff;
            stats.diffCount++;

            // 実際の飛距離を計算（目標距離 + y軸のズレ）
            if (shot.distance !== null && shot.distance > 0) {
              const actualDistance = shot.distance + y;
              stats.totalDistance += actualDistance;
              stats.distanceCount++;
            }

            stats.shots.push({
              distance: shot.distance,
              accuracy: diff,
              date: shot.date,
            });
          }
        }
      });

      // 平均を計算
      Object.keys(clubStats).forEach((club) => {
        const stats = clubStats[club];
        stats.count = stats.shotCount;
        stats.avgDistance = stats.distanceCount > 0 ? Math.round(stats.totalDistance / stats.distanceCount) : 0;
        stats.avgAccuracy = stats.diffCount > 0 ? Math.round(stats.totalDiff / stats.diffCount) : 0;
      });

      // クラブを平均精度でソート（精度が良い順 = ズレが小さい順）
      const sortedClubs = Object.entries(clubStats)
        .map(([club, stats]) => ({
          club,
          count: stats.count,
          avgDistance: stats.avgDistance,
          avgAccuracy: stats.avgAccuracy,
          shots: stats.shots,
        }))
        .sort((a, b) => a.avgAccuracy - b.avgAccuracy);

      // ワースト5を取得（精度が悪い順 = ズレが大きい順）
      const worstClubs = [...sortedClubs].reverse().slice(0, 5);

      detailedStats = {
        allClubStats: sortedClubs,
        worstClubs,
        totalShots: allShots.length,
      };
    }

    return NextResponse.json({
      success: true,
      recentUsers,
      searchedUser,
      detailedStats,
    });
  } catch (error) {
    console.error('[Admin Analytics API] Error:', error);
    return NextResponse.json(
      { error: '使用状況の取得に失敗しました' },
      { status: 500 }
    );
  }
}
