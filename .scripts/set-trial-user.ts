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

  // すべてのサブスクリプションを削除
  if (user.subscriptions.length > 0) {
    await prisma.subscription.deleteMany({
      where: {
        userId: user.id,
      },
    });
    console.log(`\nDeleted ${user.subscriptions.length} subscription(s)`);
  }

  // ユーザーのステータスをinactiveに更新し、stripeCustomerIdもクリア（完全にトライアル状態に戻す）
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'inactive',
      stripeCustomerId: null,
    },
  });

  console.log('\n✅ User set to trial (inactive) status successfully!');
  console.log(`  Email: ${userEmail}`);
  console.log(`  Status: inactive (trial)`);
  console.log(`  Stripe Customer ID: null`);
  console.log(`  All subscriptions: deleted`);
  console.log('\nこれで本番環境でトライアルユーザーとして新規サブスクリプション登録できます。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
