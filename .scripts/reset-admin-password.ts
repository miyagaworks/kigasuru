import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const userId = 'cmgebj45j00008o5v5935291j';
  const newPassword = 'admin123'; // 新しいパスワード

  console.log('新しいパスワードを設定します:', newPassword);

  // パスワードのハッシュ化
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // パスワードを更新
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
    select: { id: true, email: true, name: true },
  });

  console.log('パスワードが更新されました:', updatedUser);
  console.log('');
  console.log('ログイン情報:');
  console.log('  Email:', updatedUser.email);
  console.log('  Password:', newPassword);
}

resetPassword()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
