// app/api/line/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { lineEventStore } from "@/lib/line/event-store";

// LINE Webhook イベントの型定義
interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  source?: {
    type: string;
    userId: string;
  };
  message?: {
    type: string;
    text: string;
  };
  follow?: {
    isNotification: boolean;
  };
  unfollow?: Record<string, never>;
}

interface LineWebhookBody {
  events: LineWebhookEvent[];
}

// 署名検証
function validateSignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error("❌ LINE_MESSAGING_CHANNEL_SECRET is not set");
    return false;
  }

  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");

  const isValid = hash === signature;
  return isValid;
}

// LINEメッセージ送信関数
async function replyMessage(replyToken: string, message: string) {
  const accessToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("❌ LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set");
    return;
  }

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Failed to send LINE message:", errorText);
    }
  } catch (error) {
    console.error("❌ Error sending LINE message:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();

    // 空のリクエスト（検証用）の場合は200を返す
    if (bodyText === "" || bodyText === "{}") {
      return NextResponse.json({ success: true });
    }

    // 署名検証
    const signature = request.headers.get("x-line-signature");

    if (!signature) {
      console.error("❌ No signature provided");
      // 検証リクエストの可能性があるため、開発環境では200を返す
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // 開発環境では警告のみ、本番環境では厳密にチェック
    if (!validateSignature(bodyText, signature)) {
      if (process.env.NODE_ENV === "production") {
        console.error("❌ Invalid signature in production");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 403 }
        );
      } else {
        console.warn(
          "⚠️ Webhook signature verification failed (development mode) - continuing anyway"
        );
      }
    }

    let body: LineWebhookBody;
    try {
      body = JSON.parse(bodyText) as LineWebhookBody;
    } catch (e) {
      console.error("❌ Failed to parse body:", e);
      // パースエラーでも検証用の場合は200を返す
      return NextResponse.json({ success: true });
    }

    // イベントが空の場合（検証用）
    if (!body.events || body.events.length === 0) {
      return NextResponse.json({ success: true });
    }

    // イベント処理
    for (const event of body.events) {
      if (!event.source?.userId) {
        console.warn("⚠️ No userId in event, skipping");
        continue;
      }

      const lineUserId = event.source.userId;

      // フォローイベント（友だち追加）
      if (event.type === "follow") {
        // イベントストアに記録（confirm-friendエンドポイントで使用）
        lineEventStore.recordFollowEvent(lineUserId);

        // ウェルカムメッセージを送信
        if (event.replyToken) {
          await replyMessage(
            event.replyToken,
            "友だち追加ありがとうございます🏌️‍♂️⛳️\n\n上手くなる気がするぅぅぅ PRO をご利用いただき、ありがとうございます！\n\nこのLINEアカウントから：\n📊 ショット分析の定期レポート\n📅 ラウンド予定のリマインダー\n💡 上達のためのヒント\n\nなどの情報をお届けします。\n\n友だち追加ありがとうございます！\n無料期間が30日間に延長されました🎉\n\nさらなる上達を目指して\n一緒に頑張りましょう！"
          );
        }
      }

      // アンフォローイベント（ブロック）
      if (event.type === "unfollow") {
        // 通知を無効化
        try {
          await prisma.user.updateMany({
            where: {
              lineUserId: lineUserId,
            },
            data: {
              lineNotificationEnabled: false,
              lineFriendAdded: false,
            },
          });
        } catch (error) {
          console.error("❌ Failed to update user profile:", error);
        }
      }

      // メッセージイベント
      if (event.type === "message" && event.message?.type === "text") {
        const userMessage = event.message.text;

        // 自動応答
        if (event.replyToken) {
          let replyText = "";

          if (userMessage.includes("使い方")) {
            replyText =
              "📱 上手くなる気がするぅぅぅ PRO の使い方\n\n1. 練習場やコースでショットを記録\n2. ジャイロセンサーで傾斜を自動検出\n3. クラブごとの飛距離や方向を分析\n\n詳しくはWebアプリの「設定」→「ヘルプ」をご覧ください。";
          } else if (userMessage.includes("通知")) {
            replyText =
              "🔔 通知設定について\n\nWebアプリの「設定」から、LINE通知のオン/オフを変更できます。\n\n定期レポートやリマインダーの配信タイミングもカスタマイズ可能です。";
          } else if (userMessage.includes("分析") || userMessage.includes("統計")) {
            replyText =
              "📊 ショット分析機能\n\n・クラブごとの平均飛距離\n・方向性の傾向\n・傾斜別のパフォーマンス\n・ミスの種類と頻度\n\nWebアプリの「分析」タブで詳しく確認できます。";
          } else {
            replyText =
              "メッセージありがとうございます😊\n\nお問い合わせは、Webアプリの「設定」→「サポート」からお願いします。\n\n「使い方」「通知」「分析」と送信すると、詳しい情報をお送りします。";
          }

          await replyMessage(event.replyToken, replyText);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    // エラーが発生しても、検証用の場合は200を返す
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
