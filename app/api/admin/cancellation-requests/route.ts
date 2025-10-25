export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

/**
 * GET /api/admin/cancellation-requests
 * 全ての解約申請を取得（管理者のみ）
 */
export async function GET() {
  // Get pending cancellation requests
  try {
    const session = await auth();

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const requests = await prisma.cancellationRequest.findMany({
      where: {
        status: 'pending', // pending状態のみ取得
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            subscriptions: {
              where: {
                status: 'active',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // 古い順に処理
      },
    });

    return NextResponse.json({
      requests,
    });
  } catch (error) {
    console.error('[Admin Cancellation Requests API] Error:', error);
    return NextResponse.json(
      { error: '解約申請の取得に失敗しました' },
      { status: 500 }
    );
  }
}
