import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // デバッグモードのチェック
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug');

  if (debug !== 'true') {
    return NextResponse.json({ error: 'Debug mode not enabled' }, { status: 403 });
  }

  // 環境変数の存在チェック（値は表示しない）
  const envCheck = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    LINE_CHANNEL_ID: !!process.env.LINE_CHANNEL_ID,
    LINE_CHANNEL_SECRET: !!process.env.LINE_CHANNEL_SECRET,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  };

  // 長さのチェック（セキュリティのため値は表示しない）
  const envLengths = {
    LINE_CHANNEL_ID_LENGTH: process.env.LINE_CHANNEL_ID?.length || 0,
    LINE_CHANNEL_SECRET_LENGTH: process.env.LINE_CHANNEL_SECRET?.length || 0,
  };

  // LINE Channel IDの形式チェック（数字のみかどうか）
  const lineChannelIdFormat = process.env.LINE_CHANNEL_ID ?
    /^\d+$/.test(process.env.LINE_CHANNEL_ID) : false;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    envCheck,
    envLengths,
    lineChannelIdFormat,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
  });
}