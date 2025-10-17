// app/api/auth/2fa/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyTwoFactorCode, verifyBackupCode } from '@/lib/auth/two-factor';

/**
 * TOTPコードまたはバックアップコードを検証
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, isBackupCode } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    let verified = false;

    if (isBackupCode) {
      verified = await verifyBackupCode(session.user.id, code);
    } else {
      verified = await verifyTwoFactorCode(session.user.id, code);
    }

    if (!verified) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/auth/2fa/verify] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
