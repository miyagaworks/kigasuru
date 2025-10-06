// lib/line/client.ts
export async function checkFriendshipStatus(
  lineUserId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${lineUserId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );

    // 200なら友だち、404なら友だちではない
    return response.ok;
  } catch (error) {
    console.error("Friend check error:", error);
    return false;
  }
}
