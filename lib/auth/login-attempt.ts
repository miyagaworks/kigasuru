// lib/auth/login-attempt.ts
import { prisma } from '@/lib/prisma';

// ログイン試行回数制限の設定
const MAX_ATTEMPTS = 5; // 最大試行回数
const LOCKOUT_DURATION_MINUTES = 15; // ロックアウト期間（分）
const ATTEMPT_WINDOW_MINUTES = 15; // 試行回数をカウントする期間（分）

/**
 * ログイン試行をチェックして、ロックアウト状態を確認
 * @param email ユーザーのメールアドレス
 * @param ipAddress リクエスト元のIPアドレス（オプション）
 * @returns ロックアウト中の場合はエラーメッセージ、そうでなければnull
 */
export async function checkLoginAttempts(
  email: string,
  ipAddress?: string,
): Promise<{ allowed: boolean; message?: string; remainingAttempts?: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MINUTES * 60 * 1000);

  try {
    // 指定期間内の失敗した試行回数を取得
    const recentFailedAttempts = await prisma.loginAttempt.count({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    // 最大試行回数を超えている場合
    if (recentFailedAttempts >= MAX_ATTEMPTS) {
      // 最後の失敗試行を取得
      const lastFailedAttempt = await prisma.loginAttempt.findFirst({
        where: {
          email: email.toLowerCase(),
          success: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (lastFailedAttempt) {
        const lockoutEnd = new Date(
          lastFailedAttempt.createdAt.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );

        if (now < lockoutEnd) {
          const remainingMinutes = Math.ceil((lockoutEnd.getTime() - now.getTime()) / (60 * 1000));
          return {
            allowed: false,
            message: `ログイン試行回数が上限に達しました。${remainingMinutes}分後に再試行してください。`,
          };
        }
      }
    }

    const remainingAttempts = MAX_ATTEMPTS - recentFailedAttempts;

    return {
      allowed: true,
      remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
    };
  } catch (error) {
    console.error('[checkLoginAttempts] Database error:', error);
    // DB接続エラーの場合は安全側に倒してログインを許可
    return { allowed: true };
  }
}

/**
 * ログイン試行を記録
 * @param email ユーザーのメールアドレス
 * @param success ログインが成功したかどうか
 * @param ipAddress リクエスト元のIPアドレス（オプション）
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string,
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        success,
        ipAddress,
      },
    });

    // 成功した場合、古い失敗記録をクリーンアップ（オプション）
    if (success) {
      const oldDate = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);
      await prisma.loginAttempt.deleteMany({
        where: {
          email: email.toLowerCase(),
          success: false,
          createdAt: {
            lt: oldDate,
          },
        },
      });
    }
  } catch (error) {
    console.error('[recordLoginAttempt] Database error:', error);
    // 記録失敗はログのみで、ログインプロセスは継続
  }
}

/**
 * 古いログイン試行記録をクリーンアップ（定期実行推奨）
 * @param daysToKeep 保持する日数（デフォルト: 30日）
 */
export async function cleanupOldLoginAttempts(daysToKeep: number = 30): Promise<number> {
  try {
    const oldDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const result = await prisma.loginAttempt.deleteMany({
      where: {
        createdAt: {
          lt: oldDate,
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error('[cleanupOldLoginAttempts] Database error:', error);
    return 0;
  }
}
