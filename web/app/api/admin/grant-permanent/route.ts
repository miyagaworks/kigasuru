export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
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

      // 永久利用権サブスクリプションを作成
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 100); // 100年後

      const subscription = await tx.subscription.create({
        data: {
          userId,
          plan: 'permanent',
          status: 'active',
          startDate: new Date(),
          endDate,
        },
      });

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
