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
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

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
    if (email || userId) {
      searchedUser = await prisma.user.findFirst({
        where: email
          ? { email: { contains: email, mode: 'insensitive' as const } }
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

    return NextResponse.json({
      success: true,
      recentUsers,
      searchedUser,
    });
  } catch (error) {
    console.error('[Admin Analytics API] Error:', error);
    return NextResponse.json(
      { error: '使用状況の取得に失敗しました' },
      { status: 500 }
    );
  }
}
