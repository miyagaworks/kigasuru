import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/admin/cancellation-requests/[id]/reject
 * 解約申請を却下
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { reason } = await req.json();

    // 解約申請を取得
    const cancellationRequest = await prisma.cancellationRequest.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!cancellationRequest) {
      return NextResponse.json(
        { error: '解約申請が見つかりません' },
        { status: 404 }
      );
    }

    if (cancellationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'この解約申請は既に処理されています' },
        { status: 400 }
      );
    }

    // 解約申請を却下
    const updatedRequest = await prisma.cancellationRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        processedAt: new Date(),
        processedBy: session.user.email,
      },
    });

    // ユーザーに却下メールを送信
    try {
      const emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">解約申請が却下されました</h2>
          <p>いつも上手くなる気がするぅぅぅをご利用いただき、ありがとうございます。</p>
          <p>誠に恐れ入りますが、サブスクリプションの解約申請を却下させていただきました。</p>

          ${reason ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #856404;">却下理由</h3>
              <p style="color: #856404; margin: 0;">${reason}</p>
            </div>
          ` : ''}

          <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
          <p>今後とも上手くなる気がするぅぅぅをよろしくお願いいたします。</p>
        </div>
      `;

      await sendEmail({
        to: [cancellationRequest.user.email],
        subject: '【上手くなる気がするぅぅぅ】サブスクリプション解約申請却下のお知らせ',
        html: emailContent,
      });
    } catch (emailError) {
      console.error('[Cancellation Rejection] Email Error:', emailError);
      // メール送信エラーでも処理は完了とする
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: '解約申請を却下しました',
    });
  } catch (error) {
    console.error('[Reject Cancellation Request API] Error:', error);
    return NextResponse.json(
      { error: '解約申請の却下に失敗しました' },
      { status: 500 }
    );
  }
}
