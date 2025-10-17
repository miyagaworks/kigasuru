// app/api/auth/2fa/enable/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { enableTwoFactor } from '@/lib/auth/two-factor';

/**
 * 二要素認証を有効化
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const success = await enableTwoFactor(session.user.id, code);

    if (!success) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/auth/2fa/enable] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
