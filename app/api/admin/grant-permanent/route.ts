export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin';

/**
 * POST /api/admin/grant-permanent
 * 永久利用権を付与（管理者のみ）
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { userId, reason } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // ユーザー存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptions: {
          select: { id: true, plan: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    if (user.subscriptionStatus === 'permanent') {
      return NextResponse.json(
        { error: 'このユーザーは既に永久利用権を持っています' },
        { status: 400 }
      );
    }

    // トランザクションで永久利用権を付与
    const result = await prisma.$transaction(async (tx) => {
      // ユーザーのステータスを更新
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'permanent',
          trialEndsAt: null,
          subscriptionEndsAt: null,
        },
      });

      // 永久利用権サブスクリプションを作成または更新
      const now = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 100); // 100年後

      let subscription;
      if (user.subscriptions && user.subscriptions.length > 0) {
        // 既存のサブスクリプションを更新
        subscription = await tx.subscription.update({
          where: { id: user.subscriptions[0].id },
          data: {
            plan: 'permanent_personal',
            status: 'active',
            startDate: now,
            endDate,
          },
        });
      } else {
        // 新規サブスクリプションを作成
        subscription = await tx.subscription.create({
          data: {
            userId,
            plan: 'permanent_personal',
            status: 'active',
            startDate: now,
            endDate,
          },
        });
      }

      // 理由をログに記録
      if (reason) {
        console.log(`[Grant Permanent] User: ${userId}, Reason: ${reason}`);
      }

      return { user: updatedUser, subscription };
    });

    return NextResponse.json({
      success: true,
      message: '永久利用権を付与しました',
      user: result.user,
      subscription: result.subscription,
    });
  } catch (error) {
    console.error('[Admin Grant Permanent API] Error:', error);
    return NextResponse.json(
      { error: '永久利用権の付与に失敗しました' },
      { status: 500 }
    );
  }
}
