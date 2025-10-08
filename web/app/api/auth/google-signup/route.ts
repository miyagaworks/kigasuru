import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // サインアップフロー用のクッキーを設定
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_flow', 'signup', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10分間有効
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Google signup preparation error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare Google signup' },
      { status: 500 }
    );
  }
}