import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdmin() {
  const userId = 'cmgebj45j00008o5v5935291j';

  // 現在のユーザー情報を確認
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  console.log('現在のユーザー情報:', user);

  if (!user) {
    console.log('ユーザーが見つかりません');
    return;
  }

  // メールアドレスを admin@kigasuru.com に変更し、メール認証を完了
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      email: 'admin@kigasuru.com',
      emailVerified: new Date(),
    },
  });

  console.log('更新後のユーザー情報:', updatedUser);
}

updateAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
