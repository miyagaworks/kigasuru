import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 認証フロークッキーをクリア
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth_flow');

    return response;
  } catch (error) {
    console.error('Clear auth flow error:', error);
    return NextResponse.json(
      { error: 'Failed to clear auth flow' },
      { status: 500 }
    );
  }
}