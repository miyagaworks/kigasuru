// app/api/auth/webauthn/authenticate/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponseForUser } from '@/lib/auth/webauthn';

/**
 * WebAuthn認証レスポンスを検証
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { response } = body;

    if (!response) {
      return NextResponse.json({ error: 'Response is required' }, { status: 400 });
    }

    const result = await verifyAuthenticationResponseForUser(response);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/auth/webauthn/authenticate/verify] Error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
