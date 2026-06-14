export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { Prisma, type Shot } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * ショットデータの保存API
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await req.json();
    const {
      date,
      club,
      distance,
      clientId,
      roundId,
      holeNumber,
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

    // 必須フィールドのバリデーション（distance は任意・null 許容）
    if (!date || !club) {
      return NextResponse.json(
        { error: 'date, club は必須です' },
        { status: 400 }
      );
    }

    // distance: null 許容 ＋ NaN ガード（空文字等で NaN を保存しない）
    let distanceValue: number | null =
      distance != null ? parseInt(String(distance)) : null;
    if (distanceValue != null && Number.isNaN(distanceValue)) {
      distanceValue = null;
    }

    // holeNumber: Int 変換（来なければ null）
    const holeNumberValue =
      holeNumber != null ? parseInt(String(holeNumber)) : null;

    // 保存フィールド（userId / clientId は含めない。両分岐で使い回す）
    const fields = {
      date: new Date(date),
      club,
      distance: distanceValue,
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
      actualTemperature: actualTemperature
        ? parseFloat(String(actualTemperature))
        : null,
      missType: missType || null,
      manualLocation: manualLocation || false,
      roundId: roundId ?? null,
      holeNumber: holeNumberValue,
    };

    // clientId があれば upsert（冪等）、なければ従来 create（旧クライアント互換）
    let shot: Shot | null = null;
    if (clientId) {
      try {
        shot = await prisma.shot.upsert({
          where: { clientId },
          create: { userId, clientId, ...fields },
          // ★ update に userId / clientId を含めない（所有者不変・clientId は where キー）
          update: { ...fields },
        });
      } catch (error) {
        // P2002（同一 clientId の同時リクエスト等の unique 競合）は
        // 500 にせず、既存行を findUnique で取得して返す（§5.4 risk）
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          shot = await prisma.shot.findUnique({ where: { clientId } });
          if (!shot) {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      // 旧クライアント互換（clientId 無し）
      shot = await prisma.shot.create({
        data: { userId, ...fields },
      });
    }

    if (!shot) {
      throw new Error('ショットの保存結果を取得できませんでした');
    }

    console.log(`[Shots API] Saved shot ${shot.id} for user ${userId}`);

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
