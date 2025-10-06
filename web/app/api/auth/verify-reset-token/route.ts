import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'トークンが必要です' }, { status: 400 });
    }

    // トークンの検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: '無効または期限切れのトークンです' }, { status: 400 });
    }

    // 期限切れかどうかチェック
    if (resetToken.expires < new Date()) {
      return NextResponse.json({ error: '無効または期限切れのトークンです' }, { status: 400 });
    }

    return NextResponse.json({ message: '有効なトークンです' }, { status: 200 });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'トークン検証中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
