import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/subscription/cancel-request
 * サブスクリプション解約申請を作成
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { reason } = await req.json();

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: {
            status: 'active',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // アクティブなサブスクリプションがあるか確認
    if (user.subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'アクティブなサブスクリプションがありません' },
        { status: 400 }
      );
    }

    // 既に解約申請済みか確認
    const existingRequest = await prisma.cancellationRequest.findFirst({
      where: {
        userId: user.id,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: '既に解約申請が処理待ちです' },
        { status: 400 }
      );
    }

    // 解約申請を作成
    const cancellationRequest = await prisma.cancellationRequest.create({
      data: {
        userId: user.id,
        reason: reason || null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      request: cancellationRequest,
    });
  } catch (error) {
    console.error('[Cancel Request API] Error:', error);
    return NextResponse.json(
      { error: '解約申請の作成に失敗しました' },
      { status: 500 }
    );
  }
}
