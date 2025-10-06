import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

// ビルド時に環境変数がない場合はダミー値を使用
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy-key-for-build', {
  apiVersion: '2025-09-30.clover',
});

/**
 * POST /api/admin/cancellation-requests/[id]/process
 * 解約申請を処理（承認/拒否）
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { action } = await req.json(); // 'approve' or 'reject'

    // 解約申請を取得
    const cancellationRequest = await prisma.cancellationRequest.findUnique({
      where: { id },
    });

    if (!cancellationRequest) {
      return NextResponse.json(
        { error: '解約申請が見つかりません' },
        { status: 404 }
      );
    }

    if (cancellationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'この解約申請は既に処理されています' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // ユーザー情報を取得
      const user = await prisma.user.findUnique({
        where: { id: cancellationRequest.userId },
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

      // Stripeのサブスクリプションをキャンセル
      if (user.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        } catch (stripeError) {
          console.error('[Cancel Subscription] Stripe Error:', stripeError);
          // Stripeエラーでも処理を続行（DBは更新する）
        }
      }

      // DBのサブスクリプションステータスを更新
      if (user.subscriptions.length > 0) {
        await prisma.subscription.updateMany({
          where: {
            userId: user.id,
            status: 'active',
          },
          data: {
            status: 'canceled',
          },
        });
      }

      // ユーザーのサブスクリプションステータスを更新
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'canceled',
        },
      });

      // 解約申請を承認済みに更新
      const updatedRequest = await prisma.cancellationRequest.update({
        where: { id },
        data: {
          status: 'approved',
          processedAt: new Date(),
          processedBy: session.user.email,
        },
      });

      return NextResponse.json({
        success: true,
        request: updatedRequest,
        message: 'サブスクリプションを解約しました',
      });
    } else if (action === 'reject') {
      // 解約申請を拒否
      const updatedRequest = await prisma.cancellationRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          processedAt: new Date(),
          processedBy: session.user.email,
        },
      });

      return NextResponse.json({
        success: true,
        request: updatedRequest,
        message: '解約申請を拒否しました',
      });
    } else {
      return NextResponse.json(
        { error: '無効なアクションです' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Process Cancellation Request API] Error:', error);
    return NextResponse.json(
      { error: '解約申請の処理に失敗しました' },
      { status: 500 }
    );
  }
}
