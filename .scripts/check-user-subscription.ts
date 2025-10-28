import { prisma } from '../lib/prisma.js';

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'info@bialpha.com' },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  });

  console.log('User status:', user?.subscriptionStatus);
  console.log('Stripe Customer ID:', user?.stripeCustomerId);
  console.log('\nSubscriptions:', user?.subscriptions.length);
  user?.subscriptions.forEach((sub, index) => {
    console.log(`\n[${index + 1}]`);
    console.log('  Status:', sub.status);
    console.log('  Plan:', sub.plan);
    console.log('  Stripe Sub ID:', sub.stripeSubscriptionId);
    console.log('  Created:', sub.createdAt);
  });

  await prisma.$disconnect();
}

check();
