import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// Get base URL for Stripe redirects
function getBaseUrl(): string {
  // Prefer NEXTAUTH_URL if set with proper scheme
  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('http')) {
    return process.env.NEXTAUTH_URL;
  }
  // Production environment on Vercel - always use production domain
  if (process.env.VERCEL_ENV === 'production') {
    return 'https://app.kigasuru.com';
  }
  // Preview deployments - use the preview URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Development fallback
  return 'http://localhost:3000';
}

// ビルド時に環境変数がない場合はダミー値を使用
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy-key-for-build', {
  apiVersion: '2025-09-30.clover',
});

/**
 * POST /api/stripe/create-checkout-session
 * Stripeチェックアウトセッションを作成
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

    const { priceType } = await req.json();

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // Stripe CustomerIDがない場合は作成
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // DBに保存
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // プランに応じたPrice IDを取得
    let priceId: string;
    let mode: 'subscription' | 'payment';
    const metadata: Record<string, string> = {
      userId: user.id,
    };

    switch (priceType) {
      case 'monthly':
        priceId = process.env.STRIPE_PRICE_MONTHLY!;
        mode = 'subscription';
        break;
      case 'yearly':
        priceId = process.env.STRIPE_PRICE_YEARLY!;
        mode = 'subscription';
        break;
      default:
        return NextResponse.json(
          { error: '無効なプランタイプです' },
          { status: 400 }
        );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'プランIDが設定されていません' },
        { status: 500 }
      );
    }

    // Checkout Sessionを作成
    const baseUrl = getBaseUrl();
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription`,
      metadata,
      automatic_tax: {
        enabled: true,
      },
      customer_update: {
        address: 'auto',
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('[Stripe Create Checkout Session] Error:', error);
    return NextResponse.json(
      { error: 'チェックアウトセッションの作成に失敗しました' },
      { status: 500 }
    );
  }
}
