export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
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
        totalDistance: number;
        avgDistance: number;
        accuracySum: number;
        avgAccuracy: number;
        shots: Array<{ distance: number; accuracy: number; date: Date }>;
      }> = {};

      allShots.forEach((shot) => {
        if (!clubStats[shot.club]) {
          clubStats[shot.club] = {
            count: 0,
            totalDistance: 0,
            avgDistance: 0,
            accuracySum: 0,
            avgAccuracy: 0,
            shots: [],
          };
        }

        const stats = clubStats[shot.club];
        stats.count++;
        stats.totalDistance += shot.distance;

        // 精度を計算（result から x, y を取得）
        if (shot.result && typeof shot.result === 'object') {
          const result = shot.result as { x?: number; y?: number };
          if (typeof result.x === 'number' && typeof result.y === 'number') {
            // 中心からの距離を計算（ピタゴラスの定理）
            const distanceFromCenter = Math.sqrt(result.x ** 2 + result.y ** 2);
            // 精度スコア（中心からの距離が小さいほど高い）
            // 最大距離を70ydと仮定し、パーセンテージで表現
            const accuracy = Math.max(0, 100 - (distanceFromCenter / 70) * 100);
            stats.accuracySum += accuracy;
            stats.shots.push({
              distance: shot.distance,
              accuracy,
              date: shot.date,
            });
          }
        }
      });

      // 平均を計算
      Object.keys(clubStats).forEach((club) => {
        const stats = clubStats[club];
        stats.avgDistance = stats.totalDistance / stats.count;
        stats.avgAccuracy = stats.shots.length > 0 ? stats.accuracySum / stats.shots.length : 0;
      });

      // クラブを平均精度でソート
      const sortedClubs = Object.entries(clubStats)
        .map(([club, stats]) => ({
          club,
          ...stats,
        }))
        .sort((a, b) => b.avgAccuracy - a.avgAccuracy);

      // ワースト5を取得
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
