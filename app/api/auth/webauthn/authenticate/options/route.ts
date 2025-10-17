// app/api/auth/webauthn/authenticate/options/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateAuthenticationOptionsForUser } from '@/lib/auth/webauthn';

/**
 * WebAuthn認証オプションを生成
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // ログイン済みの場合はそのユーザーのみ、未ログインの場合は全ての認証情報を許可
    const options = await generateAuthenticationOptionsForUser(userId);

    return NextResponse.json(options);
  } catch (error) {
    console.error('[POST /api/auth/webauthn/authenticate/options] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
