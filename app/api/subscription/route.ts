export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * サブスクリプション情報の型定義
 */
interface SubscriptionData {
  id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
  serviceEndDate: Date | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  interval?: string;
  cancelAtPeriodEnd?: boolean;
}

/**
 * GET /api/subscription
 * サブスクリプション情報を取得
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // サブスクリプション情報を取得（serviceEndDateも含む）
    // トライアルユーザーの場合はactiveなサブスクリプションのみ取得
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        ...(user.subscriptionStatus === 'trial' ? { status: 'active' } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        plan: true,
        status: true,
        startDate: true,
        endDate: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        canceledAt: true,
        serviceEndDate: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
      },
    });

    // 解約申請の状態を取得
    const cancellationRequest = await prisma.cancellationRequest.findFirst({
      where: {
        userId: session.user.id,
        status: 'pending',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // トライアル期間の計算
    let trialDaysRemaining = 0;
    if (user.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndsAt);
      if (trialEnd > now) {
        trialDaysRemaining = Math.ceil(
          (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    }

    // 永久利用権ユーザーの判定
    const isPermanentUser = user.subscriptionStatus === 'permanent';

    // サブスクリプションデータの整形
    let subscriptionData: SubscriptionData | null = null;

    if (subscription) {
      // 更新間隔の判定
      let interval = 'month';
      if (subscription.plan.includes('yearly') || subscription.plan.includes('year')) {
        interval = 'year';
      } else if (subscription.plan === 'permanent' || isPermanentUser) {
        interval = 'permanent';
      }

      subscriptionData = {
        ...subscription,
        interval,
        cancelAtPeriodEnd: false, // Stripe webhookで更新予定
      };
    } else if (isPermanentUser) {
      // 永久利用権ユーザーの場合はモックデータを作成
      subscriptionData = {
        id: 'permanent-subscription',
        userId: session.user.id,
        plan: 'permanent',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(9999, 11, 31),
        currentPeriodStart: null,
        currentPeriodEnd: null,
        canceledAt: null,
        serviceEndDate: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        interval: 'permanent',
        cancelAtPeriodEnd: false,
      };
    }

    // 支払い履歴を取得
    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      subscription: subscriptionData,
      user: {
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        subscriptionEndsAt: user.subscriptionEndsAt,
        trialDaysRemaining,
        isPermanentUser,
      },
      payments,
      cancellationRequest: cancellationRequest ? {
        id: cancellationRequest.id,
        status: cancellationRequest.status,
        createdAt: cancellationRequest.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('[Subscription API] Error:', error);
    return NextResponse.json(
      { error: 'サブスクリプション情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
