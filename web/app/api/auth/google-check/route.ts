import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, from } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // ログインページからのリクエストの場合
    if (from === 'signin') {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });

      if (!existingUser) {
        // 未登録ユーザー
        return NextResponse.json({
          registered: false,
          error: 'UNREGISTERED_USER',
          message: 'このGoogleアカウントは登録されていません。新規登録ページから登録してください。'
        });
      }
    }

    // 登録済みユーザー、または新規登録ページからのリクエスト
    return NextResponse.json({ registered: true });
  } catch (error) {
    console.error('Google check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}