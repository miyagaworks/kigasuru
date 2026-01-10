export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * ユーザー設定の取得API
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!settings) {
      // 設定が存在しない場合はデフォルト値を返す
      return NextResponse.json({
        success: true,
        settings: {
          clubs: ['DR', '3W', '5W', '7W', '4U', '5U', '5I', '6I', '7I', '8I', '9I', 'PW', '50', '52', '54', '56', '58'],
          enabledFields: {
            slope: true,
            lie: true,
            club: true,
            strength: true,
            wind: true,
            temperature: true,
            feeling: true,
            memo: true,
          },
          gyroCalibration: null,
        },
      });
    }

    console.log(`[Settings API] Retrieved settings for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      settings: {
        clubs: settings.clubs,
        enabledFields: settings.enabledFields,
        gyroCalibration: settings.gyroCalibration,
      },
    });
  } catch (error) {
    console.error('[Settings API] Error:', error);
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * ユーザー設定の保存API
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await req.json();
    const { clubs, enabledFields, gyroCalibration } = body;

    // 設定を保存（upsert: 存在すれば更新、なければ作成）
    const settings = await prisma.userSettings.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        ...(clubs !== undefined && { clubs }),
        ...(enabledFields !== undefined && { enabledFields }),
        ...(gyroCalibration !== undefined && { gyroCalibration }),
      },
      create: {
        userId: session.user.id,
        clubs: clubs || ['DR', '3W', '5W', '7W', '4U', '5U', '5I', '6I', '7I', '8I', '9I', 'PW', '50', '52', '54', '56', '58'],
        enabledFields: enabledFields || {
          slope: true,
          lie: true,
          club: true,
          strength: true,
          wind: true,
          temperature: true,
          feeling: true,
          memo: true,
        },
        gyroCalibration: gyroCalibration || null,
      },
    });

    console.log(`[Settings API] Saved settings for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      settings: {
        clubs: settings.clubs,
        enabledFields: settings.enabledFields,
        gyroCalibration: settings.gyroCalibration,
      },
    });
  } catch (error) {
    console.error('[Settings API] Error:', error);
    return NextResponse.json(
      { error: '設定の保存に失敗しました' },
      { status: 500 }
    );
  }
}
