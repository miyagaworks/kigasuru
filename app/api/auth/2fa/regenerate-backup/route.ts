// app/api/auth/2fa/regenerate-backup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { regenerateBackupCodes } from '@/lib/auth/two-factor';

/**
 * バックアップコードを再生成
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backupCodes = await regenerateBackupCodes(session.user.id);

    return NextResponse.json({ backupCodes });
  } catch (error) {
    console.error('[POST /api/auth/2fa/regenerate-backup] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
