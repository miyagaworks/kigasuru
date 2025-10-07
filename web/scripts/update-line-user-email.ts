#!/usr/bin/env tsx
// Script to update LINE user's email address

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLineUserEmail() {
  try {
    // LINE認証のユーザーを探す
    const lineUsers = await prisma.user.findMany({
      where: {
        accounts: {
          some: {
            provider: 'line'
          }
        }
      },
      include: {
        accounts: true
      }
    });

    console.log(`Found ${lineUsers.length} LINE users`);

    for (const user of lineUsers) {
      console.log(`\nUser: ${user.name || 'No name'}`);
      console.log(`Current email: ${user.email}`);
      console.log(`Providers: ${user.accounts.map(a => a.provider).join(', ')}`);

      // miyacchiee@gmail.comを設定（みやちゃんユーザーの場合）
      if (user.email.includes('@kigasuru.com')) {
        if (user.name === 'みやちゃん') {
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
              email: 'miyacchiee@gmail.com',
              emailVerified: new Date() // メール確認済みとして設定
            }
          });
          console.log(`✅ Updated email to: ${updated.email}`);
        } else {
          console.log(`❓ Found another LINE user: ${user.name}. What email should be set?`);
        }
      } else {
        console.log(`⚠️  User already has email: ${user.email}`);
      }
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLineUserEmail();