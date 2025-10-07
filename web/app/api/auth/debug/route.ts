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
    NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,
    LINE_CHANNEL_ID_LENGTH: process.env.LINE_CHANNEL_ID?.length || 0,
    LINE_CHANNEL_SECRET_LENGTH: process.env.LINE_CHANNEL_SECRET?.length || 0,
    GOOGLE_CLIENT_ID_LENGTH: process.env.GOOGLE_CLIENT_ID?.length || 0,
    GOOGLE_CLIENT_SECRET_LENGTH: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
  };

  // LINE Channel IDの形式チェック（数字のみかどうか）
  const lineChannelIdFormat = process.env.LINE_CHANNEL_ID ?
    /^\d+$/.test(process.env.LINE_CHANNEL_ID) : false;

  // エラーの可能性をチェック
  const possibleIssues = [];

  if (!envCheck.NEXTAUTH_SECRET) {
    possibleIssues.push('NEXTAUTH_SECRET is not set');
  } else if (envLengths.NEXTAUTH_SECRET_LENGTH < 32) {
    possibleIssues.push('NEXTAUTH_SECRET is too short (should be at least 32 chars)');
  }

  if (!envCheck.LINE_CHANNEL_ID || !envCheck.LINE_CHANNEL_SECRET) {
    possibleIssues.push('LINE credentials are missing');
  }

  if (envCheck.LINE_CHANNEL_ID && !lineChannelIdFormat) {
    possibleIssues.push('LINE_CHANNEL_ID should contain only numbers');
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    envCheck,
    envLengths,
    lineChannelIdFormat,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
    possibleIssues,
    runtime: 'nodejs',
  });
}