// auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Line from 'next-auth/providers/line';
import { LoginSchema } from '@/lib/auth/schemas';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

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
    Line({
      clientId: process.env.LINE_CHANNEL_ID!,
      clientSecret: process.env.LINE_CHANNEL_SECRET!,
      allowDangerousEmailAccountLinking: false,
      client: {
        id_token_signed_response_alg: 'HS256',
      },
      authorization: {
        params: {
          scope: 'profile openid', // emailを削除
          response_type: 'code',
        },
      },
      // iOS PWAでのcookie問題のため、stateチェックを無効化
      checks: [],
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
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) {
            return null;
          }

          // メール認証チェック
          if (!user.emailVerified) {
            console.error('メール未認証:', email);
            return null;
          }

          return {
            id: user.id,
            name: user.name || '',
            email: user.email,
          };
        } catch (error) {
          console.error('認証エラー:', error);
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
  debug: process.env.NODE_ENV === 'development' || process.env.NEXTAUTH_DEBUG === 'true',
} satisfies NextAuthConfig;
