import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { calculateRefund, calculateServiceEndDate } from '@/lib/refund-calculator';
import { sendEmail } from '@/lib/email';

// ビルド時に環境変数がない場合はダミー値を使用
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy-key-for-build', {
  apiVersion: '2025-09-30.clover',
});

/**
 * POST /api/admin/cancellation-requests/[id]/approve
 * 解約申請を承認し、返金処理を実行
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

    // 解約申請を取得
    const cancellationRequest = await prisma.cancellationRequest.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            subscriptions: {
              where: {
                status: 'active',
              },
            },
          },
        },
      },
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

    const user = cancellationRequest.user;
    const subscription = user.subscriptions[0];

    if (!subscription) {
      return NextResponse.json(
        { error: 'アクティブなサブスクリプションが見つかりません' },
        { status: 404 }
      );
    }

    // 返金計算（契約開始日を基準にする）
    const interval = subscription.plan === 'yearly' ? 'year' : 'month';
    const contractStartDate = new Date(subscription.startDate);

    const refundCalc = calculateRefund(
      contractStartDate,
      interval,
      new Date()
    );

    // calculateRefund内で既に正しいserviceEndDateが計算されている
    const serviceEndDate = refundCalc.serviceEndDate;
    const planName = subscription.plan === 'yearly' ? '年額プラン' : '月額プラン';

    let refundId: string | null = null;

    // Stripeでの返金処理（年額プランの場合のみ）
    if (refundCalc.shouldRefund && refundCalc.refundAmount > 0 && subscription.stripeSubscriptionId) {
      try {
        // 最新の支払いを取得
        const invoices = await stripe.invoices.list({
          subscription: subscription.stripeSubscriptionId,
          limit: 1,
        });

        if (invoices.data.length > 0) {
          const invoice = invoices.data[0];
          const paymentIntentId = typeof invoice.payment_intent === 'string'
            ? invoice.payment_intent
            : invoice.payment_intent?.id;

          if (paymentIntentId) {
            // PaymentIntentから支払い情報を取得
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            const chargeId = typeof paymentIntent.latest_charge === 'string'
              ? paymentIntent.latest_charge
              : paymentIntent.latest_charge?.id;

            if (chargeId) {
              // 返金を実行（円単位を銭単位に変換）
              const refund = await stripe.refunds.create({
                charge: chargeId,
                amount: Math.round(refundCalc.refundAmount * 100), // 円→銭に変換
                reason: 'requested_by_customer',
                metadata: {
                  userId: user.id,
                  cancellationRequestId: id,
                  usedMonths: refundCalc.usedMonths.toString(),
                  serviceEndDate: serviceEndDate.toISOString(),
                },
              });

              refundId = refund.id;
              console.log('[Refund] Successfully processed:', refund.id, refundCalc.refundAmount);
            }
          }
        }
      } catch (stripeError) {
        console.error('[Refund] Stripe Error:', stripeError);
        return NextResponse.json(
          { error: 'Stripeでの返金処理に失敗しました' },
          { status: 500 }
        );
      }
    }

    // Stripeのサブスクリプションをキャンセル
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } catch (stripeError) {
        console.error('[Cancel Subscription] Stripe Error:', stripeError);
        // エラーでも処理を続行
      }
    }

    // DBのサブスクリプションステータスを更新
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
        serviceEndDate: serviceEndDate,
      },
    });

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

    // ユーザーに解約確定メールを送信
    try {
      const emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d5a3d;">解約が確定しました</h2>
          <p>いつも上手くなる気がするぅぅぅをご利用いただき、ありがとうございます。</p>
          <p>サブスクリプションの解約が確定いたしました。</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">解約内容</h3>
            <p><strong>プラン:</strong> ${planName}</p>
            <p><strong>サービス利用終了日:</strong> ${serviceEndDate.toLocaleDateString('ja-JP')}</p>
            <p style="color: #d32f2f;"><strong>利用停止日:</strong> ${new Date(serviceEndDate.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}</p>
            ${refundCalc.shouldRefund && refundCalc.refundAmount > 0 ? `
              <div style="border-top: 1px solid #ddd; margin-top: 15px; padding-top: 15px;">
                <p><strong>使用期間:</strong> ${refundCalc.usedMonths}ヶ月分（${refundCalc.usedAmount}円）</p>
                <p style="color: #2d5a3d; font-size: 18px;"><strong>返金額:</strong> ${refundCalc.refundAmount.toLocaleString()}円</p>
                <p style="font-size: 12px; color: #666;">返金処理には5〜10営業日程度かかる場合があります。</p>
              </div>
            ` : `
              <p style="margin-top: 15px;">月額プランのため、返金はございません。</p>
            `}
          </div>

          <p>今後とも上手くなる気がするぅぅぅをよろしくお願いいたします。</p>
        </div>
      `;

      await sendEmail({
        to: [user.email],
        subject: '【上手くなる気がするぅぅぅ】サブスクリプション解約確定のお知らせ',
        html: emailContent,
      });
    } catch (emailError) {
      console.error('[Cancellation Approval] Email Error:', emailError);
      // メール送信エラーでも処理は完了とする
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      refund: {
        shouldRefund: refundCalc.shouldRefund,
        refundAmount: refundCalc.refundAmount,
        refundId,
        serviceEndDate: serviceEndDate.toISOString(),
      },
      message: '解約申請を承認しました',
    });
  } catch (error) {
    console.error('[Approve Cancellation Request API] Error:', error);
    return NextResponse.json(
      { error: '解約申請の承認に失敗しました' },
      { status: 500 }
    );
  }
}
