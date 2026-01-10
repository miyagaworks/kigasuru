// lib/auth/two-factor.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';

// 暗号化のための秘密鍵（環境変数から取得）
const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY || 'default-encryption-key-change-this-in-production';

/**
 * 暗号化関数
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * 復号化関数
 */
function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * TOTP秘密鍵とQRコードを生成
 */
export async function generateTwoFactorSecret(userId: string, email: string): Promise<{
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}> {
  // TOTP秘密鍵を生成
  const secret = speakeasy.generateSecret({
    name: `Kigasuru (${email})`,
    issuer: 'Kigasuru',
  });

  // QRコードを生成
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

  // バックアップコードを生成（10個）
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  // 秘密鍵とバックアップコードを暗号化して保存
  const encryptedSecret = encrypt(secret.base32);
  const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encryptedSecret,
      backupCodes: encryptedBackupCodes,
      twoFactorEnabled: false, // まだ有効化されていない
    },
  });

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * TOTPコードを検証
 */
export async function verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) {
    return false;
  }

  const decryptedSecret = decrypt(user.twoFactorSecret);

  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token: code,
    window: 1, // 前後30秒の範囲を許容
  });

  return verified;
}

/**
 * バックアップコードを検証
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true },
  });

  if (!user?.backupCodes) {
    return false;
  }

  const decryptedBackupCodes = JSON.parse(decrypt(user.backupCodes)) as string[];
  const normalizedCode = code.replace(/\s/g, '').toUpperCase();

  // バックアップコードが一致するかチェック
  const index = decryptedBackupCodes.indexOf(normalizedCode);
  if (index === -1) {
    return false;
  }

  // 使用済みのバックアップコードを削除
  decryptedBackupCodes.splice(index, 1);
  const encryptedBackupCodes = encrypt(JSON.stringify(decryptedBackupCodes));

  await prisma.user.update({
    where: { id: userId },
    data: { backupCodes: encryptedBackupCodes },
  });

  return true;
}

/**
 * 二要素認証を有効化
 */
export async function enableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
  const isValid = await verifyTwoFactorCode(userId, verificationCode);

  if (!isValid) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  return true;
}

/**
 * 二要素認証を無効化
 */
export async function disableTwoFactor(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  });
}

/**
 * 二要素認証が有効かチェック
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  return user?.twoFactorEnabled || false;
}

/**
 * 新しいバックアップコードを生成
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));

  await prisma.user.update({
    where: { id: userId },
    data: { backupCodes: encryptedBackupCodes },
  });

  return backupCodes;
}
