// app/api/auth/2fa/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateTwoFactorSecret } from '@/lib/auth/two-factor';

/**
 * TOTP設定を開始（QRコード生成）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await generateTwoFactorSecret(session.user.id, session.user.email);

    return NextResponse.json({
      qrCodeUrl: result.qrCodeUrl,
      secret: result.secret,
      backupCodes: result.backupCodes,
    });
  } catch (error) {
    console.error('[POST /api/auth/2fa/setup] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
