import { prisma } from '../lib/prisma.js';

async function changeToTrial() {
  const userEmail = 'info@bialpha.com';

  // ユーザーを取得
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
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

  if (latestSubscription) {
    console.log('\nLatest subscription:');
    console.log(`  ID: ${latestSubscription.id}`);
    console.log(`  Status: ${latestSubscription.status}`);
    console.log(`  Plan: ${latestSubscription.plan}`);

    // サブスクリプションを削除（物理削除ではなくキャンセル状態に）
    await prisma.subscription.update({
      where: { id: latestSubscription.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });
    console.log('  → Subscription canceled');
  }

  // ユーザーのステータスをtrialに変更
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'trial',
      stripeSubscriptionId: null,
      subscriptionEndsAt: null,
    },
  });

  console.log('\n✅ Successfully changed to trial!');
  console.log(`  User status: trial`);
  console.log(`  Stripe subscription ID: null`);
}

changeToTrial()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
