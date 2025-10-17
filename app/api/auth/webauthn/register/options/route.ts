// app/api/auth/webauthn/register/options/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateRegistrationOptionsForUser } from '@/lib/auth/webauthn';

/**
 * WebAuthn登録オプションを生成
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const options = await generateRegistrationOptionsForUser(
      session.user.id,
      session.user.email,
      session.user.name || undefined
    );

    return NextResponse.json(options);
  } catch (error) {
    console.error('[POST /api/auth/webauthn/register/options] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
