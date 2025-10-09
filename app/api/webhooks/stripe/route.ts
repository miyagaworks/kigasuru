import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// ビルド時に環境変数がない場合はダミー値を使用
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy-key-for-build', {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy-secret-for-build';

// Stripe APIの実行時プロパティを含む型定義
type StripeSubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
};

type StripeInvoiceWithSubscription = Stripe.Invoice & {
  subscription: string | Stripe.Subscription | null;
  payment_intent: string | Stripe.PaymentIntent | null;
};

/**
 * POST /api/webhooks/stripe
 * Stripe Webhook受信エンドポイント
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] Missing signature');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Webhookイベントの検証
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err}` },
        { status: 400 }
      );
    }

    // イベントタイプに応じた処理
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as StripeInvoiceWithSubscription);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as StripeInvoiceWithSubscription);
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * チェックアウトセッション完了時の処理
 * - サブスクリプション開始
 * - 永久利用権購入
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;
  const metadata = session.metadata || {};

  // ユーザーをStripe Customer IDで検索
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('[Stripe Webhook] User not found for customer:', customerId);
    return;
  }

  // 永久利用権の購入の場合
  if (metadata.type === 'permanent') {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'permanent',
        subscriptionEndsAt: null, // 永久利用権には終了日なし
      },
    });

    // Payment記録を作成
    await prisma.payment.create({
      data: {
        userId: user.id,
        stripePaymentIntentId: session.payment_intent as string,
        amount: session.amount_total || 0,
        currency: session.currency || 'jpy',
        status: 'succeeded',
        plan: metadata.plan || 'permanent_personal',
      },
    });

    return;
  }

  // サブスクリプションの場合
  if (subscriptionId) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
      },
    });
  }
}

/**
 * サブスクリプション作成時の処理
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('[Stripe Webhook] User not found for customer:', customerId);
    return;
  }

  // プラン名を取得
  const priceId = subscription.items.data[0]?.price.id;
  let plan = 'monthly';
  if (priceId === process.env.STRIPE_PRICE_YEARLY) {
    plan = 'yearly';
  }

  // Subscriptionレコードを作成
  await prisma.subscription.create({
    data: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      plan,
      startDate: new Date((subscription as StripeSubscriptionWithPeriod).current_period_start * 1000),
      endDate: new Date((subscription as StripeSubscriptionWithPeriod).current_period_end * 1000),
    },
  });

  // ユーザー情報を更新
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: 'active',
      subscriptionEndsAt: new Date((subscription as StripeSubscriptionWithPeriod).current_period_end * 1000),
    },
  });
}

/**
 * サブスクリプション更新時の処理
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!user) {
    console.error('[Stripe Webhook] User not found for subscription:', subscription.id);
    return;
  }

  // プラン名を取得
  const priceId = subscription.items.data[0]?.price.id;
  let plan = 'monthly';
  if (priceId === process.env.STRIPE_PRICE_YEARLY) {
    plan = 'yearly';
  }

  // Subscriptionレコードを更新
  await prisma.subscription.updateMany({
    where: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: subscription.status,
      plan,
      startDate: new Date((subscription as StripeSubscriptionWithPeriod).current_period_start * 1000),
      endDate: new Date((subscription as StripeSubscriptionWithPeriod).current_period_end * 1000),
    },
  });

  // ユーザー情報を更新
  let subscriptionStatus = 'active';
  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    subscriptionStatus = 'expired';
  } else if ((subscription as StripeSubscriptionWithPeriod).cancel_at_period_end) {
    subscriptionStatus = 'canceling';
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus,
      subscriptionEndsAt: new Date((subscription as StripeSubscriptionWithPeriod).current_period_end * 1000),
    },
  });
}

/**
 * サブスクリプション削除時の処理
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!user) {
    console.error('[Stripe Webhook] User not found for subscription:', subscription.id);
    return;
  }

  // Subscriptionレコードを更新
  await prisma.subscription.updateMany({
    where: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: 'canceled',
    },
  });

  // ユーザー情報を更新
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'expired',
      subscriptionEndsAt: new Date((subscription as StripeSubscriptionWithPeriod).current_period_end * 1000),
    },
  });
}

/**
 * 請求書支払い成功時の処理
 */
async function handleInvoicePaymentSucceeded(invoice: StripeInvoiceWithSubscription) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!user) {
    console.error('[Stripe Webhook] User not found for subscription:', subscriptionId);
    return;
  }

  // Payment記録を作成
  const lineItem = invoice.lines.data[0] as { price?: { recurring?: { interval?: string } } };
  await prisma.payment.create({
    data: {
      userId: user.id,
      stripePaymentIntentId: invoice.payment_intent as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      plan: lineItem?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly',
    },
  });
}

/**
 * 請求書支払い失敗時の処理
 */
async function handleInvoicePaymentFailed(invoice: StripeInvoiceWithSubscription) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!user) {
    console.error('[Stripe Webhook] User not found for subscription:', subscriptionId);
    return;
  }

  // Payment記録を作成（失敗）
  const lineItem = invoice.lines.data[0] as { price?: { recurring?: { interval?: string } } };
  await prisma.payment.create({
    data: {
      userId: user.id,
      stripePaymentIntentId: invoice.payment_intent as string || '',
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      plan: lineItem?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly',
    },
  });
}
