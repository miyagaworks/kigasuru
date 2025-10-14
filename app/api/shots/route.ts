export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * ショットデータの保存API
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await req.json();
    const {
      date,
      club,
      distance,
      slope,
      lie,
      strength,
      wind,
      temperature,
      result,
      feeling,
      memo,
      golfCourse,
      latitude,
      longitude,
      actualTemperature,
      missType,
      manualLocation,
    } = body;

    // 必須フィールドのバリデーション
    if (!date || !club || distance === undefined || distance === null) {
      return NextResponse.json(
        { error: 'date, club, distance は必須です' },
        { status: 400 }
      );
    }

    // ショットデータを保存
    const shot = await prisma.shot.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        club,
        distance: parseInt(String(distance)),
        slope: slope || null,
        lie: lie || null,
        strength: strength || null,
        wind: wind || null,
        temperature: temperature || null,
        result: result || null,
        feeling: feeling || null,
        memo: memo || '',
        golfCourse: golfCourse || null,
        latitude: latitude ? parseFloat(String(latitude)) : null,
        longitude: longitude ? parseFloat(String(longitude)) : null,
        actualTemperature: actualTemperature ? parseFloat(String(actualTemperature)) : null,
        missType: missType || null,
        manualLocation: manualLocation || false,
      },
    });

    console.log(`[Shots API] Created shot ${shot.id} for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      shotId: shot.id,
    });
  } catch (error) {
    console.error('[Shots API] Error:', error);
    return NextResponse.json(
      { error: 'ショットデータの保存に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * ユーザーのショットデータを取得API
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const shots = await prisma.shot.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`[Shots API] Retrieved ${shots.length} shots for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      shots,
    });
  } catch (error) {
    console.error('[Shots API] Error:', error);
    return NextResponse.json(
      { error: 'ショットデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}
