import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'トークンとパスワードが必要です' }, { status: 400 });
    }

    // パスワードの長さをチェック
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で入力してください' },
        { status: 400 },
      );
    }

    // トークンの検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: '無効または期限切れのトークンです' },
        { status: 400 },
      );
    }

    // 期限切れかどうかチェック
    if (resetToken.expires < new Date()) {
      // 期限切れのトークンを削除
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { error: '無効または期限切れのトークンです' },
        { status: 400 },
      );
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // ユーザーのパスワードを更新
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // 使用済みのトークンを削除
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({
      success: true,
      message: 'パスワードが正常にリセットされました',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'パスワードのリセット中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
