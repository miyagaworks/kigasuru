// lib/auth/line-provider.ts
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';

export interface LineProfile {
  sub: string;
  name: string;
  picture: string;
  email?: string;
}

export default function LineProvider<P extends LineProfile>(
  options: OAuthUserConfig<P>,
): OAuthConfig<P> {
  return {
    id: 'line',
    name: 'LINE',
    type: 'oauth',
    authorization: {
      url: 'https://access.line.me/oauth2/v2.1/authorize',
      params: {
        scope: 'profile openid email',
        response_type: 'code',
      },
    },
    checks: ['state'],
    token: {
      url: 'https://api.line.me/oauth2/v2.1/token',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async request(context: any) {
        const { provider, params } = context;

        const response = await fetch(provider.token?.url as string, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: params.code as string,
            redirect_uri: provider.callbackUrl,
            client_id: options.clientId as string,
            client_secret: options.clientSecret as string,
          }),
        });

        const tokens = await response.json();

        if (!response.ok) {
          throw new Error(`LINE token error: ${JSON.stringify(tokens)}`);
        }

        // id_tokenを除外してJWT検証をスキップ
        const { id_token, ...rest } = tokens;
        return { tokens: rest };
      },
    },
    userinfo: {
      url: 'https://api.line.me/v2/profile',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async request({ tokens }: any) {
        const response = await fetch('https://api.line.me/v2/profile', {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        const profile = await response.json();

        if (!response.ok) {
          throw new Error(`LINE profile error: ${JSON.stringify(profile)}`);
        }

        // LINEのプロフィールをNextAuth形式に変換
        return {
          sub: profile.userId,
          name: profile.displayName,
          picture: profile.pictureUrl,
          email: profile.email || `${profile.userId}@line.me`, // LINEはemailが必須ではない
        } as P;
      },
    },
    profile(profile: P) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email || `${profile.sub}@line.me`,
        image: profile.picture,
      };
    },
    style: {
      logo: '/line-logo.svg',
      bg: '#00B900',
      text: '#fff',
    },
    options,
  };
}
