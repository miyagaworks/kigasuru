// app/api/auth/2fa/disable/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { disableTwoFactor } from '@/lib/auth/two-factor';

/**
 * 二要素認証を無効化
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await disableTwoFactor(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/auth/2fa/disable] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
