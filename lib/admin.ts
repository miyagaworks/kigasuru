/**
 * 管理者権限チェック
 */

const ADMIN_EMAIL = 'admin@kigasuru.com';

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function requireAdmin(email: string | null | undefined): void {
  if (!isAdmin(email)) {
    throw new Error('管理者権限が必要です');
  }
}
