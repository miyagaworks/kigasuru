// lib/auth/ip-restriction.ts
import { prisma } from '@/lib/prisma';

interface IpCheckResult {
  allowed: boolean;
  reason?: string;
  countryCode?: string;
  countryName?: string;
}

/**
 * IPアドレスが許可されているかチェック
 */
export async function checkIpAddress(ipAddress?: string): Promise<IpCheckResult> {
  if (!ipAddress) {
    return { allowed: true };
  }

  try {
    // ローカルIPは常に許可
    if (isLocalIp(ipAddress)) {
      return { allowed: true };
    }

    // 1. ホワイトリストチェック（最優先）
    const whitelisted = await prisma.ipWhitelist.findUnique({
      where: { ipAddress },
    });

    if (whitelisted) {
      return { allowed: true };
    }

    // 2. ブラックリストチェック
    const blacklisted = await prisma.ipBlacklist.findUnique({
      where: { ipAddress },
    });

    if (blacklisted) {
      // 期限付きブロックの場合、期限をチェック
      if (blacklisted.expiresAt && blacklisted.expiresAt < new Date()) {
        // 期限切れの場合は削除
        await prisma.ipBlacklist.delete({
          where: { id: blacklisted.id },
        });
      } else {
        return {
          allowed: false,
          reason: blacklisted.reason || 'このIPアドレスはブロックされています',
        };
      }
    }

    // 3. 国別制限チェック
    const geoData = await getIpGeoLocation(ipAddress);

    if (geoData?.countryCode) {
      const countryRestriction = await prisma.countryRestriction.findUnique({
        where: { countryCode: geoData.countryCode },
      });

      if (countryRestriction && countryRestriction.blocked) {
        return {
          allowed: false,
          reason: countryRestriction.reason || `${geoData.countryName || geoData.countryCode}からのアクセスは制限されています`,
          countryCode: geoData.countryCode,
          countryName: geoData.countryName,
        };
      }

      return {
        allowed: true,
        countryCode: geoData.countryCode,
        countryName: geoData.countryName,
      };
    }

    // ジオロケーション情報が取得できない場合は許可
    return { allowed: true };
  } catch (error) {
    console.error('[checkIpAddress] Error:', error);
    // エラー時は安全側に倒して許可（サービス継続性を優先）
    return { allowed: true };
  }
}

/**
 * IPアドレスをブラックリストに追加
 */
export async function addToBlacklist(data: {
  ipAddress: string;
  reason?: string;
  blockedBy?: string;
  expiresAt?: Date;
}): Promise<void> {
  await prisma.ipBlacklist.upsert({
    where: { ipAddress: data.ipAddress },
    update: {
      reason: data.reason,
      blockedBy: data.blockedBy,
      expiresAt: data.expiresAt,
    },
    create: data,
  });
}

/**
 * IPアドレスをブラックリストから削除
 */
export async function removeFromBlacklist(ipAddress: string): Promise<void> {
  await prisma.ipBlacklist.deleteMany({
    where: { ipAddress },
  });
}

/**
 * IPアドレスをホワイトリストに追加
 */
export async function addToWhitelist(data: {
  ipAddress: string;
  description?: string;
  addedBy?: string;
}): Promise<void> {
  await prisma.ipWhitelist.upsert({
    where: { ipAddress: data.ipAddress },
    update: {
      description: data.description,
      addedBy: data.addedBy,
    },
    create: data,
  });
}

/**
 * IPアドレスをホワイトリストから削除
 */
export async function removeFromWhitelist(ipAddress: string): Promise<void> {
  await prisma.ipWhitelist.deleteMany({
    where: { ipAddress },
  });
}

/**
 * 国をブロック/ブロック解除
 */
export async function setCountryRestriction(data: {
  countryCode: string;
  countryName: string;
  blocked: boolean;
  reason?: string;
}): Promise<void> {
  await prisma.countryRestriction.upsert({
    where: { countryCode: data.countryCode },
    update: {
      blocked: data.blocked,
      reason: data.reason,
      countryName: data.countryName,
    },
    create: data,
  });
}

/**
 * ローカルIPかどうか判定
 */
function isLocalIp(ipAddress: string): boolean {
  return (
    ipAddress === '::1' ||
    ipAddress === '127.0.0.1' ||
    ipAddress.startsWith('127.') ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.16.') ||
    ipAddress.startsWith('172.17.') ||
    ipAddress.startsWith('172.18.') ||
    ipAddress.startsWith('172.19.') ||
    ipAddress.startsWith('172.2') ||
    ipAddress.startsWith('172.30.') ||
    ipAddress.startsWith('172.31.')
  );
}

/**
 * IPアドレスからジオロケーション情報を取得
 */
interface GeoData {
  countryCode: string;
  countryName: string;
  city?: string;
  regionName?: string;
}

async function getIpGeoLocation(ipAddress: string): Promise<GeoData | null> {
  if (!ipAddress || isLocalIp(ipAddress)) {
    return null;
  }

  try {
    // 無料のIP geolocation API（ip-api.com）を使用
    // 本番環境では有料の信頼性の高いAPIを使用することを推奨
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,regionName,city`, {
      signal: AbortSignal.timeout(5000), // 5秒でタイムアウト
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.status === 'success') {
      return {
        countryCode: data.countryCode || '',
        countryName: data.country || '',
        city: data.city,
        regionName: data.regionName,
      };
    }

    return null;
  } catch (error) {
    console.error('[getIpGeoLocation] Error:', error);
    return null;
  }
}

/**
 * 期限切れのブラックリストエントリをクリーンアップ
 */
export async function cleanupExpiredBlacklist(): Promise<number> {
  try {
    const result = await prisma.ipBlacklist.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error('[cleanupExpiredBlacklist] Error:', error);
    return 0;
  }
}

/**
 * 自動ブラックリスト追加（不審なアクティビティ検知時）
 */
export async function autoBlockIp(data: {
  ipAddress: string;
  reason: string;
  durationHours?: number; // デフォルト24時間
}): Promise<void> {
  const durationHours = data.durationHours || 24;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + durationHours);

  await addToBlacklist({
    ipAddress: data.ipAddress,
    reason: data.reason,
    blockedBy: 'system',
    expiresAt,
  });
}
