export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin';

/**
 * GET /api/admin/subscriptions
 * 全ユーザーのサブスクリプション情報を取得（管理者のみ）
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

    // すべてのユーザーとそのサブスクリプション情報を取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        trialEndsAt: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptions: {
          select: {
            id: true,
            plan: true,
            status: true,
            stripeSubscriptionId: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // 最新のサブスクリプションのみ取得
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // レスポンス用にデータを整形
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      trialEndsAt: user.trialEndsAt?.toISOString() || null,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() || null,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      subscription: user.subscriptions[0]
        ? {
            id: user.subscriptions[0].id,
            plan: user.subscriptions[0].plan,
            status: user.subscriptions[0].status,
            stripeSubscriptionId: user.subscriptions[0].stripeSubscriptionId,
            startDate: user.subscriptions[0].startDate.toISOString(),
            endDate: user.subscriptions[0].endDate?.toISOString() || null,
            createdAt: user.subscriptions[0].createdAt.toISOString(),
          }
        : null,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('[Admin Subscriptions API] Error:', error);
    return NextResponse.json(
      { error: 'サブスクリプション一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
