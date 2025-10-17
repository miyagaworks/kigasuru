// lib/auth/webauthn.ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';

// Types from @simplewebauthn/browser
type RegistrationResponseJSON = Record<string, unknown>;
type AuthenticationResponseJSON = Record<string, unknown>;

// WebAuthn設定
const rpName = 'Kigasuru';
const rpID = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || 'localhost';
const origin = process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN || 'http://localhost:3000';

/**
 * 登録オプションを生成
 */
export async function generateRegistrationOptionsForUser(
  userId: string,
  email: string,
  name?: string
) {
  // 既存の認証情報を取得
  const existingCredentials = await prisma.webAuthnCredential.findMany({
    where: { userId },
    select: {
      credentialID: true,
      transports: true,
    },
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: userId,
    userName: email,
    userDisplayName: name || email,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((cred) => ({
      id: Buffer.from(cred.credentialID, 'base64url'),
      type: 'public-key',
      transports: cred.transports ? JSON.parse(cred.transports) : undefined,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // チャレンジを保存（有効期限5分）
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  await prisma.webAuthnChallenge.create({
    data: {
      userId,
      challenge: options.challenge,
      type: 'registration',
      expiresAt,
    },
  });

  return options;
}

/**
 * 登録レスポンスを検証
 */
export async function verifyRegistrationResponseForUser(
  userId: string,
  response: RegistrationResponseJSON,
  credentialName?: string
) {
  // チャレンジを取得
  const challengeRecord = await prisma.webAuthnChallenge.findFirst({
    where: {
      userId,
      type: 'registration',
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!challengeRecord) {
    throw new Error('チャレンジが見つかりません');
  }

  const verification = await verifyRegistrationResponse({
    response: response as unknown as Parameters<typeof verifyRegistrationResponse>[0]['response'],
    expectedChallenge: challengeRecord.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('検証に失敗しました');
  }

  const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  // 認証情報を保存
  await prisma.webAuthnCredential.create({
    data: {
      userId,
      credentialID: Buffer.from(credentialID).toString('base64url'),
      publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
      counter: BigInt(counter),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: (response as {response?: {transports?: string[]}}).response?.transports
        ? JSON.stringify((response as {response: {transports: string[]}}).response.transports)
        : null,
      name: credentialName,
    },
  });

  // チャレンジを削除
  await prisma.webAuthnChallenge.delete({
    where: { id: challengeRecord.id },
  });

  return { verified: true };
}

/**
 * 認証オプションを生成
 */
export async function generateAuthenticationOptionsForUser(userId?: string) {
  let allowCredentials;

  if (userId) {
    // 特定ユーザーの認証情報を取得
    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId },
      select: {
        credentialID: true,
        transports: true,
      },
    });

    allowCredentials = credentials.map((cred) => ({
      id: Buffer.from(cred.credentialID, 'base64url'),
      type: 'public-key' as const,
      transports: cred.transports ? JSON.parse(cred.transports) : undefined,
    }));
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  });

  // チャレンジを保存（有効期限5分）
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  await prisma.webAuthnChallenge.create({
    data: {
      userId,
      challenge: options.challenge,
      type: 'authentication',
      expiresAt,
    },
  });

  return options;
}

/**
 * 認証レスポンスを検証
 */
export async function verifyAuthenticationResponseForUser(
  response: AuthenticationResponseJSON
) {
  // 認証情報を取得
  const credentialID = (response as {id?: string}).id;
  if (!credentialID) {
    throw new Error('認証情報のIDが見つかりません');
  }
  const credential = await prisma.webAuthnCredential.findUnique({
    where: { credentialID },
  });

  if (!credential) {
    throw new Error('認証情報が見つかりません');
  }

  // チャレンジを取得
  const challengeRecord = await prisma.webAuthnChallenge.findFirst({
    where: {
      type: 'authentication',
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!challengeRecord) {
    throw new Error('チャレンジが見つかりません');
  }

  const verification = await verifyAuthenticationResponse({
    response: response as unknown as Parameters<typeof verifyAuthenticationResponse>[0]['response'],
    expectedChallenge: challengeRecord.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: Buffer.from(credential.credentialID, 'base64url'),
      credentialPublicKey: Buffer.from(credential.publicKey, 'base64url'),
      counter: Number(credential.counter),
    },
  });

  if (!verification.verified) {
    throw new Error('検証に失敗しました');
  }

  // カウンターを更新
  await prisma.webAuthnCredential.update({
    where: { id: credential.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  // チャレンジを削除
  await prisma.webAuthnChallenge.delete({
    where: { id: challengeRecord.id },
  });

  return {
    verified: true,
    userId: credential.userId,
  };
}

/**
 * 認証情報を削除
 */
export async function removeWebAuthnCredential(userId: string, credentialId: string) {
  await prisma.webAuthnCredential.deleteMany({
    where: {
      userId,
      id: credentialId,
    },
  });
}

/**
 * ユーザーの認証情報一覧を取得
 */
export async function getUserWebAuthnCredentials(userId: string) {
  const credentials = await prisma.webAuthnCredential.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      deviceType: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return credentials;
}

/**
 * 期限切れのチャレンジをクリーンアップ
 */
export async function cleanupExpiredChallenges(): Promise<number> {
  try {
    const result = await prisma.webAuthnChallenge.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error('[cleanupExpiredChallenges] Error:', error);
    return 0;
  }
}
