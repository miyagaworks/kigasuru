// app/api/line/apply-promotion/route.ts
import { checkFriendshipStatus } from "@/lib/line/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function POST() {
  try {
    // NextAuth v5 セッション取得
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // メールアドレスからユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        linePromotions: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // LINE User IDがある場合は友だち状態を確認
    if (user.lineUserId) {
      const isFriend = await checkFriendshipStatus(user.lineUserId);

      if (!isFriend) {
        return NextResponse.json({
          success: false,
          message: "LINE公式アカウントを友だち追加してください",
          needsLineAdd: true,
        });
      }
    }

    // 既にプロモーションが適用されているか確認
    const existingPromotion = user.linePromotions[0];

    if (existingPromotion?.promotionApplied) {
      return NextResponse.json(
        {
          success: false,
          message: "プロモーションは既に適用されています",
          alreadyApplied: true,
        },
        { status: 200 }
      );
    }

    // トライアル期間中でない場合は適用不可
    if (user.subscriptionStatus !== "trial") {
      return NextResponse.json(
        {
          success: false,
          message: "プロモーションはトライアル期間中のみ適用可能です",
        },
        { status: 400 }
      );
    }

    // 30日後の日付を計算
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    // トランザクションで更新
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // ユーザー情報を更新
      await tx.user.update({
        where: { id: user.id },
        data: {
          trialEndsAt: trialEndDate,
          lineFriendAdded: true,
          lineFriendAddedAt: new Date(),
        },
      });

      // line_promotionsテーブルに記録
      await tx.linePromotion.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          lineUserId: user.lineUserId,
          promotionApplied: true,
          appliedAt: new Date(),
          promotionDays: 30,
        },
        update: {
          promotionApplied: true,
          appliedAt: new Date(),
          promotionDays: 30,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "LINE友だち追加プロモーションが適用されました！",
      trialEndDate: trialEndDate.toISOString(),
      daysExtended: 30,
    });
  } catch (error) {
    console.error("Apply promotion error:", error);
    return NextResponse.json(
      { error: "プロモーション適用中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// プロモーション状態を確認
export async function GET() {
  try {
    // NextAuth v5 セッション取得
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          isEligible: false,
          isApplied: false,
          message: "認証が必要です",
        },
        { status: 200 }
      );
    }

    // メールアドレスからユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        linePromotions: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          isEligible: false,
          isApplied: false,
          message: "ユーザーが見つかりません",
        },
        { status: 200 }
      );
    }

    const promotion = user.linePromotions[0];

    const isApplied = promotion?.promotionApplied || false;
    const isEligible = user.subscriptionStatus === "trial" && !isApplied;

    let daysRemaining = 0;
    if (user.trialEndsAt) {
      const endDate = new Date(user.trialEndsAt);
      const now = new Date();
      daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return NextResponse.json({
      isEligible,
      isApplied,
      daysRemaining,
      lineFriendAdded: user.lineFriendAdded || false,
      message: isApplied
        ? "プロモーション適用済み（30日間無料）"
        : isEligible
        ? "LINE友だち追加で30日間無料！"
        : "プロモーション適用対象外",
    });
  } catch (error) {
    console.error("Get promotion status error:", error);
    return NextResponse.json(
      {
        isEligible: false,
        isApplied: false,
        message: "ステータス取得中にエラーが発生しました",
      },
      { status: 200 }
    );
  }
}
