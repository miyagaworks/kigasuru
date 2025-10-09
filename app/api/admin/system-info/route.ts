export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { cache } from '@/lib/cache';

/**
 * GET /api/admin/system-info
 * システム情報を取得（管理者のみ）
 * 5分間キャッシュ
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

    // キャッシュをチェック
    const cacheKey = 'admin:system-info';
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        lastUpdate: new Date().toLocaleString('ja-JP'),
        cached: true,
      });
    }

    const [
      activeSubscriptions,
      pendingRequests,
    ] = await Promise.all([
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

    const systemInfo = {
      activeSubscriptions,
      pendingRequests,
    };

    // キャッシュに保存（5分間）
    cache.set(cacheKey, systemInfo, 300);

    return NextResponse.json({
      ...systemInfo,
      lastUpdate: new Date().toLocaleString('ja-JP'),
      cached: false,
    });
  } catch (error) {
    console.error('[Admin System Info API] Error:', error);
    return NextResponse.json(
      { error: 'システム情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
