import { prisma } from '../lib/prisma';

async function main() {
  const result = await prisma.cancellationRequest.deleteMany({
    where: {
      status: 'pending',
    },
  });

  console.log(`Deleted ${result.count} pending cancellation request(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
