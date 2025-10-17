// app/api/auth/webauthn/register/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyRegistrationResponseForUser } from '@/lib/auth/webauthn';

/**
 * WebAuthn登録レスポンスを検証
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { response, credentialName } = body;

    if (!response) {
      return NextResponse.json({ error: 'Response is required' }, { status: 400 });
    }

    const result = await verifyRegistrationResponseForUser(
      session.user.id,
      response,
      credentialName
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/auth/webauthn/register/verify] Error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
