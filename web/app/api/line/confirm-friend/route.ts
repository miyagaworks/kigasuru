// app/api/line/confirm-friend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { lineEventStore } from "@/lib/line/event-store";

export async function POST(request: NextRequest) {
  const recentFollowEvents = lineEventStore.getRecentEvents();

  try {
    // NextAuth v5 セッション取得
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // メールアドレスからユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    const userId = user.id;

    const body = await request.json();
    const { timestamp } = body;
    const confirmTime = new Date(timestamp);

    // 最近の友だち追加イベントから、まだ紐付けられていないものを探す
    let matchedLineUserId: string | null = null;

    for (const [lineUserId, event] of recentFollowEvents.entries()) {
      // 5分以内のイベントを対象とする
      const timeDiff = confirmTime.getTime() - event.timestamp.getTime();

      if (timeDiff >= 0 && timeDiff < 5 * 60 * 1000) {
        // このLINE User IDが既に他のユーザーと紐付けられていないか確認
        const existingUser = await prisma.user.findUnique({
          where: { lineUserId: lineUserId },
          select: { id: true },
        });

        // 既存ユーザーがいない、または現在のユーザーと同じ場合はOK
        if (!existingUser || existingUser.id === userId) {
          matchedLineUserId = lineUserId;
          break;
        }
      }
    }

    // matchedLineUserIdが見つかったら、イベントを削除
    if (matchedLineUserId) {
      lineEventStore.deleteEvent(matchedLineUserId);
    }

    if (!matchedLineUserId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "友だち追加が確認できませんでした。LINEで友だち追加後、もう一度お試しください。",
        },
        { status: 400 }
      );
    }

    // ユーザープロファイルを更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        lineUserId: matchedLineUserId,
        lineNotificationEnabled: true,
        lineFriendAdded: true,
        lineFriendAddedAt: new Date(),
      },
    });

    // 使用済みのイベントを削除
    lineEventStore.deleteEvent(matchedLineUserId);

    // トライアル期間中の場合、プロモーションを適用
    if (updatedUser.subscriptionStatus === "trial") {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      // トライアル期間を延長
      await prisma.user.update({
        where: { id: userId },
        data: {
          trialEndsAt: trialEndDate,
        },
      });

      // プロモーション記録
      await prisma.linePromotion.upsert({
        where: { userId: userId },
        create: {
          userId: userId,
          lineUserId: matchedLineUserId,
          promotionApplied: true,
          appliedAt: new Date(),
          promotionDays: 30,
        },
        update: {
          lineUserId: matchedLineUserId,
          promotionApplied: true,
          appliedAt: new Date(),
          promotionDays: 30,
        },
      });

      return NextResponse.json({
        success: true,
        message: "LINE連携完了！30日間の無料期間が開始されました。",
        promotionApplied: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "LINE連携が完了しました",
      promotionApplied: false,
    });
  } catch (error) {
    console.error("LINE confirm friend error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "LINE連携中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
