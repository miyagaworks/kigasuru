export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin';

/**
 * ユーザー削除API
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者チェック
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 管理者アカウントは削除できない
    if (isAdmin(user.email)) {
      return NextResponse.json(
        { error: '管理者アカウントは削除できません' },
        { status: 403 }
      );
    }

    // 自分自身は削除できない
    if (session.user.email === user.email) {
      return NextResponse.json(
        { error: '自分自身を削除することはできません' },
        { status: 400 }
      );
    }

    // 削除前に最新のユーザー情報を再取得（連続削除対策）
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: 'ユーザーは既に削除されています' },
        { status: 404 }
      );
    }

    // トランザクションを使用してユーザーとすべての関連データを削除
    try {
      await prisma.$transaction(
        async (tx) => {
          // 関連データを削除（存在チェック不要、deleteMany は0件でもエラーにならない）

          // メール認証トークンを削除
          await tx.emailVerificationToken.deleteMany({
            where: { userId: userId },
          });

          // パスワードリセットトークンを削除
          await tx.passwordResetToken.deleteMany({
            where: { userId: userId },
          });

          // ユーザー設定を削除
          await tx.userSettings.deleteMany({
            where: { userId: userId },
          });

          // ショットデータを削除
          await tx.shot.deleteMany({
            where: { userId: userId },
          });

          // サブスクリプションを削除
          await tx.subscription.deleteMany({
            where: { userId: userId },
          });

          // 支払い履歴を削除
          await tx.payment.deleteMany({
            where: { userId: userId },
          });

          // 解約申請を削除
          await tx.cancellationRequest.deleteMany({
            where: { userId: userId },
          });

          // アカウントを削除
          await tx.account.deleteMany({
            where: { userId: userId },
          });

          // セッションを削除
          await tx.session.deleteMany({
            where: { userId: userId },
          });

          // 最後にユーザー自体を削除
          await tx.user.delete({
            where: { id: userId },
          });
        },
        {
          maxWait: 10000, // 最大待機時間を10秒に設定
          timeout: 20000, // タイムアウトを20秒に設定
        }
      );

      console.log(`[Admin Delete User API] Successfully deleted user: ${userId}`);

      // 削除成功
      return NextResponse.json({
        success: true,
        message: `ユーザー「${user.name || user.email}」を削除しました`,
      });
    } catch (dbError) {
      console.error('[Admin Delete User API] Database Error:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);

      // レコードが見つからないエラー（既に削除済み）
      if (errorMessage.includes('Record to delete does not exist')) {
        return NextResponse.json(
          {
            success: true,
            message: 'ユーザーは既に削除されています',
          },
          { status: 200 }
        );
      }

      // 外部キー制約エラーの場合
      if (errorMessage.includes('Foreign key constraint')) {
        return NextResponse.json(
          {
            error: 'このユーザーは他のデータと関連付けられているため削除できません',
            details: errorMessage,
          },
          { status: 400 }
        );
      }

      // タイムアウトエラー
      if (errorMessage.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'データベース処理がタイムアウトしました。時間をおいて再度お試しください',
            details: errorMessage,
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        {
          error: 'ユーザー削除中にエラーが発生しました',
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Admin Delete User API] Error:', error);
    return NextResponse.json(
      { error: 'ユーザー削除に失敗しました' },
      { status: 500 }
    );
  }
}
