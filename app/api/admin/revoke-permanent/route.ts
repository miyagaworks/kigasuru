export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

/**
 * POST /api/admin/revoke-permanent
 * 永久利用権を解除（管理者のみ）
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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // トランザクションで永久利用権を解除
    const result = await prisma.$transaction(async (tx) => {
      // ユーザー情報を取得
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: {
              plan: 'permanent',
              status: 'active',
            },
          },
        },
      });

      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      if (user.subscriptionStatus !== 'permanent') {
        throw new Error('このユーザーは永久利用権を持っていません');
      }

      // 永久利用権サブスクリプションを無効化
      if (user.subscriptions.length > 0) {
        await tx.subscription.updateMany({
          where: {
            userId,
            plan: 'permanent',
            status: 'active',
          },
          data: {
            status: 'canceled',
            endDate: new Date(),
          },
        });
      }

      // ユーザーのステータスを期限切れに更新
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'expired',
          subscriptionEndsAt: new Date(),
        },
      });

      return { user: updatedUser };
    });

    return NextResponse.json({
      success: true,
      message: '永久利用権を解除しました',
      user: result.user,
    });
  } catch (error) {
    console.error('[Admin Revoke Permanent API] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '永久利用権の解除に失敗しました' },
      { status: 500 }
    );
  }
}
