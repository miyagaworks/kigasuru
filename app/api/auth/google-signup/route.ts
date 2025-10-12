// app/api/auth/google-signup/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * Google認証での新規登録用にCookieを設定するエンドポイント
 * ユーザー作成は auth.ts の signIn コールバックで行われる
 */
export async function POST() {
  try {
    // Cookieを設定してレスポンスを返す
    const response = NextResponse.json({ success: true });
    response.cookies.set('is_signup_flow', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5分間有効
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google signup route error:', error);
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
  }
}