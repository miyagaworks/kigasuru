// app/api/auth/login-event/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { recordLoginEvent } from '@/lib/auth/login-notification';
import { checkIpAddress } from '@/lib/auth/ip-restriction';

/**
 * ログインイベントを記録し、メール通知を送信
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // クライアントIPアドレスを取得
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined;

    // User-Agentを取得
    const userAgent = request.headers.get('user-agent') || undefined;

    // IPアドレスチェック（ログイン後なので警告のみ、次回ログイン時にブロック）
    if (ipAddress) {
      const ipCheck = await checkIpAddress(ipAddress);
      if (!ipCheck.allowed) {
        console.warn('[POST /api/auth/login-event] Suspicious IP detected:', {
          userId: session.user.id,
          ipAddress,
          reason: ipCheck.reason,
        });
      }
    }

    // ログインイベントを記録（非同期、エラーがあっても無視）
    recordLoginEvent({
      userId: session.user.id,
      ipAddress,
      userAgent,
    }).catch((error) => {
      console.error('[POST /api/auth/login-event] Error:', error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/auth/login-event] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
