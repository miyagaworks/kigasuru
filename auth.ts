// auth.ts
import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { prisma } from '@/lib/prisma';
import type { DefaultSession } from 'next-auth';

// OAuth profile interface
interface OAuthProfile {
  sub?: string;
  picture?: string;
  email?: string;
  name?: string;
}

// 型定義の拡張
declare module 'next-auth' {
  interface User {
    subscriptionStatus?: string;
    image?: string | null;
  }
  interface Session {
    user: {
      id: string;
      subscriptionStatus?: string;
      image?: string | null;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    subscriptionStatus?: string;
    picture?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'none', // iOS PWA対応のためnoneに設定
        path: '/',
        secure: true,
      },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // エラーページへのリダイレクトを許可
      if (url.includes('/auth/error')) {
        return url;
      }

      // 相対URLの処理
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // 同一オリジンのURLを許可
      if (new URL(url).origin === baseUrl) return url;

      // その他はベースURLへ
      return baseUrl;
    },

    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'credentials') {
          return true;
        }

        // OAuth認証（Google）の処理
        if (account?.provider === 'google') {
          const provider = account.provider;
          const email = user?.email?.toLowerCase();

          if (!email) {
            console.error('Google authentication requires email');
            return false;
          }

          // Googleの場合はemailで既存ユーザーを検索
          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              emailVerified: true,
              image: true,
              accounts: {
                select: {
                  provider: true,
                },
              },
            },
          });

          if (existingUser) {
            const hasProviderAccount = existingUser.accounts.some(
              (acc) => acc.provider === provider,
            );

            if (!hasProviderAccount) {
              try {
                await prisma.account.create({
                  data: {
                    userId: existingUser.id,
                    type: 'oauth',
                    provider: provider,
                    providerAccountId: (profile?.sub || user.id) as string,
                    access_token: account.access_token || '',
                    token_type: account.token_type || 'bearer',
                    id_token: account.id_token || undefined,
                    scope: account.scope || undefined,
                    expires_at: account.expires_at || undefined,
                    refresh_token: account.refresh_token || undefined,
                  },
                });

                // プロフィール画像が未設定で、OAuthプロバイダーから画像が取得できる場合は設定
                if (!existingUser.image && (profile as OAuthProfile)?.picture) {
                  await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { image: (profile as OAuthProfile).picture },
                  });
                }
              } catch (accountError) {
                console.error('Account linking error:', accountError);
              }
            } else {
              // 既にアカウントがリンクされている場合でも、画像が未設定なら更新
              if (!existingUser.image && (profile as OAuthProfile)?.picture) {
                try {
                  await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { image: (profile as OAuthProfile).picture },
                  });
                } catch (updateError) {
                  console.error('Image update error:', updateError);
                }
              }
            }

            user.id = existingUser.id;
            user.name = existingUser.name || user.name;
            user.email = existingUser.email;
            user.image = existingUser.image;
            return true;
          }

          // 新規ユーザーの場合 - Google認証で新規ユーザー作成
          if (provider === 'google') {
            try {
              const now = new Date();
              const trialEndsAt = new Date(now);
              trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7日間の無料トライアル

              if (!user?.email) {
                console.error('Google authentication requires email');
                return false;
              }
              const email = user.email.toLowerCase();

              const newUser = await prisma.user.create({
                data: {
                  name: user.name || email.split('@')[0],
                  email: email,
                  password: null,
                  subscriptionStatus: 'trial',
                  trialEndsAt,
                  emailVerified: new Date(),
                  image: (profile as OAuthProfile)?.picture || null,
                },
              });

              await prisma.account.create({
                data: {
                  userId: newUser.id,
                  type: 'oauth',
                  provider: provider,
                  providerAccountId: (profile?.sub || user.id) as string,
                  access_token: account.access_token || '',
                  token_type: account.token_type || 'bearer',
                  id_token: account.id_token || undefined,
                  scope: account.scope || undefined,
                  expires_at: account.expires_at || undefined,
                  refresh_token: account.refresh_token || undefined,
                },
              });

              // デフォルト設定を作成
              await prisma.userSettings.create({
                data: {
                  userId: newUser.id,
                  enabledFields: {
                    slope: true,
                    lie: true,
                    club: true,
                    strength: true,
                    wind: true,
                    temperature: true,
                    feeling: true,
                    memo: true,
                  },
                  clubs: ['DR', '3W', '5W', '7W', 'U4', 'U5', '5I', '6I', '7I', '8I', '9I', 'PW', '50', '52', '54', '56', '58'],
                },
              });

              user.id = newUser.id;
              user.name = newUser.name || user.name;
              user.email = newUser.email || email;
              user.image = newUser.image;

              return true;
            } catch (createError) {
              console.error('新規ユーザー作成エラー:', createError);
              throw new Error('アカウントの作成中にエラーが発生しました');
            }
          }

          return true;
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        console.error('Error details:', {
          provider: account?.provider,
          user: user?.email,
          profile: profile?.sub,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        // エラーを返すのではなく、falseを返して認証を拒否
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      // 初回ログイン時
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        // 画像はJWTに含めない（サイズが大きすぎてCookie制限を超える）
      }

      // セッション更新時（プロフィール更新など）
      if (trigger === 'update' && session) {
        if (session.name !== undefined) {
          token.name = session.name;
        }
        // 画像更新は無視（DBから毎回取得する）
      }

      // JWTサイズを最小化：画像とsubscriptionStatusはリクエスト時のみDBから取得
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;

        // subscriptionStatusと画像はここでDBから取得（JWTサイズを最小化するため）
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { subscriptionStatus: true, image: true },
          });
          session.user.subscriptionStatus = dbUser?.subscriptionStatus || 'trial';
          session.user.image = dbUser?.image || null;
        } catch {
          session.user.subscriptionStatus = 'trial';
          session.user.image = null;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  providers: authConfig.providers,
  debug: process.env.NODE_ENV === 'development',
});
