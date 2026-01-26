export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin';

/**
 * GET /api/admin/users
 * ユーザー一覧を取得（管理者のみ）
 * クエリパラメータ:
 * - page: ページ番号（1から開始、デフォルト1）
 * - limit: 1ページあたりの件数（デフォルト20）
 * - status: ステータスフィルター（all, trial, active, permanent, expired）
 * - search: 検索クエリ（名前またはメールアドレス）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    // フィルター条件を構築
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status !== 'all') {
      where.subscriptionStatus = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 総件数を取得
    const total = await prisma.user.count({ where });

    // ページネーションでユーザー一覧を取得
    const users = await prisma.user.findMany({
      where,
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
      skip: (page - 1) * limit,
      take: limit,
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

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      users: usersWithTrialUsage,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('[Admin Users API] Error:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
