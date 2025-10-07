#!/usr/bin/env tsx
// Script to set password for LINE users

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setLineUserPassword() {
  try {
    // miyacchiee@gmail.comを持つユーザーを探す
    const user = await prisma.user.findUnique({
      where: {
        email: 'miyacchiee@gmail.com'
      }
    });

    if (!user) {
      console.log('User not found with email: miyacchiee@gmail.com');
      return;
    }

    console.log(`Found user: ${user.name} (${user.email})`);

    // 一時的なパスワードを設定（後で変更してもらう）
    const tempPassword = 'TempPass123!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    });

    console.log(`✅ Password set for user: ${updated.email}`);
    console.log(`Temporary password: ${tempPassword}`);
    console.log('⚠️  Please change this password after logging in!');

  } catch (error) {
    console.error('Error setting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setLineUserPassword();