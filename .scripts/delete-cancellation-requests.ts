import { prisma } from '../lib/prisma.js';

async function main() {
  const userEmail = 'info@bialpha.com';

  // ユーザーを取得
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.error(`User not found: ${userEmail}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email}`);

  // 解約申請を削除
  const result = await prisma.cancellationRequest.deleteMany({
    where: { userId: user.id },
  });

  console.log(`✅ Deleted ${result.count} cancellation request(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
