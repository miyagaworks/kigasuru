import { prisma } from '../lib/prisma.js';

async function main() {
  const userEmail = 'info@bialpha.com';

  // Stripe から取得した情報（最新のサブスクリプション）
  const subscriptionData = {
    stripeSubscriptionId: 'sub_1SMgjEHZ13BAnGUe4mX1sY7P',
    stripePriceId: 'price_1SJuJpHZ13BAnGUep8wkRUte',
    plan: 'yearly', // interval: "year" から判定
    status: 'active',
    // 今日の日付（2025/10/27）を契約開始日とする
    startDate: new Date('2025-10-27T12:04:00+09:00'),
    endDate: new Date('2026-10-27T12:04:00+09:00'), // 1年後
    currentPeriodStart: new Date('2025-10-27T12:04:00+09:00'),
    currentPeriodEnd: new Date('2026-10-27T12:04:00+09:00'),
  };

  // ユーザーを取得
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.error(`User not found: ${userEmail}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email}`);
  console.log(`Stripe Customer ID: ${user.stripeCustomerId}`);

  // サブスクリプションを作成
  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      stripePriceId: subscriptionData.stripePriceId,
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      startDate: subscriptionData.startDate,
      endDate: subscriptionData.endDate,
      currentPeriodStart: subscriptionData.currentPeriodStart,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
    },
  });

  console.log('\n✅ Subscription created successfully!');
  console.log('  ID:', subscription.id);
  console.log('  Plan:', subscription.plan);
  console.log('  Status:', subscription.status);
  console.log('  Start Date:', subscription.startDate.toLocaleDateString('ja-JP'));
  console.log('  End Date:', subscription.endDate.toLocaleDateString('ja-JP'));
  console.log('\nこれでアプリでサブスクリプション情報が表示されるはずです。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
