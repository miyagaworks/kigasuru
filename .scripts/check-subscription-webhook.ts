import { prisma } from '../lib/prisma.js';

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'info@bialpha.com' },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!user || user.subscriptions.length === 0) {
    console.log('No subscription found');
    return;
  }

  const sub = user.subscriptions[0];
  console.log('Subscription Details:');
  console.log('  Created:', sub.createdAt.toISOString());
  console.log('  Stripe Subscription ID:', sub.stripeSubscriptionId);
  console.log('  Status:', sub.status);
  console.log('  Start Date:', sub.startDate.toISOString());
  console.log('  Plan:', sub.plan);

  console.log('\nUser Stripe Info:');
  console.log('  Stripe Customer ID:', user.stripeCustomerId);
  console.log('  Stripe Subscription ID:', user.stripeSubscriptionId);

  console.log('\n--- Analysis ---');
  console.log('Subscription was created at:', sub.createdAt.toISOString());
  console.log('This means customer.subscription.created webhook was processed.');
  console.log('\nBut no Payment record exists.');
  console.log('This means invoice.payment_succeeded webhook was NOT processed.');
  console.log('\nPossible reasons:');
  console.log('1. Webhook endpoint was not configured in Stripe at that time');
  console.log('2. Webhook failed to process (check Stripe webhook logs)');
  console.log('3. invoice.payment_succeeded event came before subscription.created');
  console.log('4. Payment was not linked to a subscription (one-time payment)');
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
