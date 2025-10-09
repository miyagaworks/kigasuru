// app/api/profile/update/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// バリデーションスキーマ
const ProfileUpdateSchema = z.object({
  name: z.string().optional(),
  image: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();

    // データの検証
    const validationResult = ProfileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json({ error: '入力データが無効です', details: errors }, { status: 400 });
    }

    const data = validationResult.data;

    // 更新データを準備
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.image !== undefined) {
      updateData.image = data.image;
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // パスワードを除外する処理
    const safeUser = { ...updatedUser };
    // 型安全に除外する
    if ('password' in safeUser) {
      const typedUser = safeUser as { password?: string | null };
      delete typedUser.password;
    }

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
  }
}
