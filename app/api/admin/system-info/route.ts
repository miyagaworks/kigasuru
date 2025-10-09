export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

/**
 * GET /api/admin/system-info
 * システム情報を取得（管理者のみ）
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

    const [
      totalUsers,
      activeSubscriptions,
      pendingRequests,
    ] = await Promise.all([
      // 総ユーザー数
      prisma.user.count(),

      // アクティブなサブスクリプション数
      prisma.subscription.count({
        where: {
          status: 'active',
        },
      }),

      // 処理待ちの解約申請数
      prisma.cancellationRequest.count({
        where: {
          status: 'pending',
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      pendingRequests,
      lastUpdate: new Date().toLocaleString('ja-JP'),
    });
  } catch (error) {
    console.error('[Admin System Info API] Error:', error);
    return NextResponse.json(
      { error: 'システム情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
