export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * ショットデータを削除API
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await params;
    const shotId = id; // Server ID is string (cuid)

    // ショットが存在し、ユーザーが所有しているか確認
    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
    });

    if (!shot) {
      return NextResponse.json({ error: 'ショットが見つかりません' }, { status: 404 });
    }

    if (shot.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // ショットを削除
    await prisma.shot.delete({
      where: { id: shotId },
    });

    console.log(`[Shots API] Deleted shot ${shotId} for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'ショットを削除しました',
    });
  } catch (error) {
    console.error('[Shots API] Delete error:', error);
    return NextResponse.json(
      { error: 'ショットデータの削除に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * ショットデータを更新API
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await params;
    const shotId = id; // Server ID is string (cuid)

    const body = await req.json();

    // ショットが存在し、ユーザーが所有しているか確認
    const existingShot = await prisma.shot.findUnique({
      where: { id: shotId },
    });

    if (!existingShot) {
      return NextResponse.json({ error: 'ショットが見つかりません' }, { status: 404 });
    }

    if (existingShot.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // ショットを更新
    const updatedShot = await prisma.shot.update({
      where: { id: shotId },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        club: body.club,
        distance: body.distance !== undefined ? parseInt(String(body.distance)) : undefined,
        slope: body.slope,
        lie: body.lie,
        strength: body.strength,
        wind: body.wind,
        temperature: body.temperature,
        result: body.result,
        feeling: body.feeling,
        memo: body.memo,
        golfCourse: body.golfCourse,
        latitude: body.latitude !== undefined ? parseFloat(String(body.latitude)) : undefined,
        longitude: body.longitude !== undefined ? parseFloat(String(body.longitude)) : undefined,
        actualTemperature: body.actualTemperature !== undefined ? parseFloat(String(body.actualTemperature)) : undefined,
        missType: body.missType,
        manualLocation: body.manualLocation,
      },
    });

    console.log(`[Shots API] Updated shot ${shotId} for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      shot: updatedShot,
    });
  } catch (error) {
    console.error('[Shots API] Update error:', error);
    return NextResponse.json(
      { error: 'ショットデータの更新に失敗しました' },
      { status: 500 }
    );
  }
}
