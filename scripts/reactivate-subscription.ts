import { prisma } from '../lib/prisma.js';

async function main() {
  const userEmail = 'info@bialpha.com';

  // ユーザーを取得
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      subscriptions: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!user) {
    console.error(`User not found: ${userEmail}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email}`);
  console.log(`Current subscription status: ${user.subscriptionStatus}`);

  // 最新のサブスクリプションを取得
  const latestSubscription = user.subscriptions[0];

  if (!latestSubscription) {
    console.error('No subscription found for user');
    process.exit(1);
  }

  console.log('\nLatest subscription:');
  console.log(`  ID: ${latestSubscription.id}`);
  console.log(`  Plan: ${latestSubscription.plan}`);
  console.log(`  Status: ${latestSubscription.status}`);
  console.log(`  Stripe Subscription ID: ${latestSubscription.stripeSubscriptionId}`);

  // サブスクリプションをアクティブに戻す
  // 契約開始日を2025/9/10に設定（テスト用）
  const startDate = new Date('2025-09-10T00:00:00+09:00');

  // 年額プランなので次回更新日は1年後（2026/9/10）
  const endDate = new Date('2026-09-10T00:00:00+09:00');

  // 現在の課金期間は契約開始から1年間
  const currentPeriodStart = new Date('2025-09-10T00:00:00+09:00');
  const currentPeriodEnd = new Date('2026-09-10T00:00:00+09:00');

  await prisma.subscription.update({
    where: { id: latestSubscription.id },
    data: {
      status: 'active',
      canceledAt: null,
      serviceEndDate: null,
      startDate: startDate, // 最初の契約開始日（2025/9/1）
      endDate: endDate, // 次回更新日（2026/9/1）
      currentPeriodStart: currentPeriodStart, // 現在の課金期間開始（2025/9/1）
      currentPeriodEnd: currentPeriodEnd, // 現在の課金期間終了（2026/9/1）
    },
  });

  // ユーザーのステータスも更新
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'active',
    },
  });

  console.log('\n✅ Subscription reactivated successfully!');
  console.log(`  New status: active`);
  console.log(`  Contract start date: ${startDate.toLocaleDateString('ja-JP')}`);
  console.log(`  Next renewal date: ${endDate.toLocaleDateString('ja-JP')}`);
  console.log(`  Current period: ${currentPeriodStart.toLocaleDateString('ja-JP')} - ${currentPeriodEnd.toLocaleDateString('ja-JP')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
