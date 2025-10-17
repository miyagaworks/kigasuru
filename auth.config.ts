// auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { LoginSchema } from '@/lib/auth/schemas';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkLoginAttempts, recordLoginAttempt } from '@/lib/auth/login-attempt';

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: false,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const validatedFields = LoginSchema.safeParse({
            email: credentials.email,
            password: credentials.password,
          });

          if (!validatedFields.success) {
            return null;
          }

          const { email, password } = validatedFields.data;
          const normalizedEmail = email.toLowerCase();

          // ログイン試行回数チェック
          const attemptCheck = await checkLoginAttempts(normalizedEmail);
          if (!attemptCheck.allowed) {
            console.error('[Login] Account locked due to too many failed attempts:', normalizedEmail);
            throw new Error(attemptCheck.message || 'ログイン試行回数が上限に達しました。');
          }

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              emailVerified: true,
            },
          });

          if (!user || !user.password) {
            // 失敗を記録
            await recordLoginAttempt(normalizedEmail, false);
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) {
            // 失敗を記録
            await recordLoginAttempt(normalizedEmail, false);
            return null;
          }

          // メール認証チェック
          if (!user.emailVerified) {
            console.error('メール未認証:', email);
            await recordLoginAttempt(normalizedEmail, false);
            return null;
          }

          // 成功を記録
          await recordLoginAttempt(normalizedEmail, true);

          return {
            id: user.id,
            name: user.name || '',
            email: user.email,
          };
        } catch (error) {
          console.error('認証エラー:', error);
          // エラーメッセージを保持してスロー（ロックアウトメッセージを表示するため）
          if (error instanceof Error && error.message.includes('ログイン試行回数')) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;
