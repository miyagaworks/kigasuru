// app/api/auth/webauthn/credentials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserWebAuthnCredentials, removeWebAuthnCredential } from '@/lib/auth/webauthn';

/**
 * ユーザーの認証情報一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentials = await getUserWebAuthnCredentials(session.user.id);

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error('[GET /api/auth/webauthn/credentials] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 認証情報を削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { credentialId } = body;

    if (!credentialId) {
      return NextResponse.json({ error: 'Credential ID is required' }, { status: 400 });
    }

    await removeWebAuthnCredential(session.user.id, credentialId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/auth/webauthn/credentials] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
