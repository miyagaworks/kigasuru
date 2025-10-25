'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/Layout';
import { Icon } from '@/components/Icon';
import { isAdmin } from '@/lib/admin';
import { calculateRefund } from '@/lib/refund-calculator';

interface CancellationRequest {
  id: string;
  userId: string;
  reason: string | null;
  status: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    subscriptions: Array<{
      id: string;
      stripeSubscriptionId: string;
      status: string;
      plan: string; // "monthly" | "yearly"
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      startDate: string;
    }>;
  };
}

export default function CancellationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!isAdmin(session.user?.email)) {
      router.push('/dashboard');
      return;
    }

    fetchCancellationRequests();
  }, [session, router]);

  async function fetchCancellationRequests() {
    try {
      const res = await fetch('/api/admin/cancellation-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch cancellation requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: string) {
    if (!confirm('この解約申請を承認しますか？')) return;

    setProcessing(requestId);
    try {
      const res = await fetch(`/api/admin/cancellation-requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('解約申請を承認しました。');
        fetchCancellationRequests();
      } else {
        const error = await res.json();
        alert(`エラー: ${error.error || '承認に失敗しました'}`);
      }
    } catch (error) {
      console.error('Failed to approve cancellation:', error);
      alert('承認処理中にエラーが発生しました。');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(requestId: string) {
    const reason = prompt('却下理由を入力してください:');
    if (!reason) return;

    setProcessing(requestId);
    try {
      const res = await fetch(`/api/admin/cancellation-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        alert('解約申請を却下しました。');
        fetchCancellationRequests();
      } else {
        const error = await res.json();
        alert(`エラー: ${error.error || '却下に失敗しました'}`);
      }
    } catch (error) {
      console.error('Failed to reject cancellation:', error);
      alert('却下処理中にエラーが発生しました。');
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <Layout showNav={false}>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-green)]"></div>
              <p className="mt-4 text-[var(--color-neutral-700)]">読み込み中...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-[var(--color-neutral-200)] rounded-lg transition-colors"
            >
              <Icon category="ui" name="back" size={24} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-neutral-900)] flex items-center gap-2">
              <Icon category="ui" name="delete" size={28} />
              解約申請管理
            </h1>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-8 text-center border border-[var(--color-neutral-200)]">
            <p className="text-[var(--color-neutral-600)]">現在、処理待ちの解約申請はありません。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => {
              const subscription = request.user.subscriptions[0];
              if (!subscription) return null;

              const interval = subscription.plan === 'yearly' ? 'year' : 'month';
              const planName = subscription.plan === 'yearly' ? '年額プラン' : '月額プラン';
              const refundCalc = calculateRefund(
                new Date(subscription.currentPeriodStart || subscription.startDate),
                interval,
                new Date(request.createdAt)
              );

              return (
                <div key={request.id} className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 border border-[var(--color-neutral-200)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ユーザー情報 */}
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">ユーザー情報</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium text-[var(--color-neutral-700)]">名前:</span>{' '}
                          <span className="text-[var(--color-neutral-900)]">{request.user.name || '未設定'}</span>
                        </p>
                        <p>
                          <span className="font-medium text-[var(--color-neutral-700)]">メール:</span>{' '}
                          <span className="text-[var(--color-neutral-900)]">{request.user.email}</span>
                        </p>
                        <p>
                          <span className="font-medium text-[var(--color-neutral-700)]">申請日:</span>{' '}
                          <span className="text-[var(--color-neutral-900)]">{new Date(request.createdAt).toLocaleString('ja-JP')}</span>
                        </p>
                        {request.reason && (
                          <div>
                            <span className="font-medium text-[var(--color-neutral-700)]">解約理由:</span>
                            <p className="mt-1 text-[var(--color-neutral-800)] bg-[var(--color-neutral-100)] p-2 rounded border border-[var(--color-neutral-200)]">
                              {request.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* プラン・返金情報 */}
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
                        プラン・返金情報
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium text-[var(--color-neutral-700)]">プラン:</span>{' '}
                          <span className="text-[var(--color-neutral-900)]">{planName}</span>
                        </p>
                        <p>
                          <span className="font-medium text-[var(--color-neutral-700)]">契約開始日:</span>{' '}
                          <span className="text-[var(--color-neutral-900)]">
                            {new Date(subscription.currentPeriodStart || subscription.startDate).toLocaleDateString('ja-JP')}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-[var(--color-neutral-700)]">サービス利用終了日:</span>{' '}
                          <span className="text-[var(--color-error-text)] font-bold">
                            {refundCalc.serviceEndDate.toLocaleDateString('ja-JP')}
                          </span>
                        </p>
                        <div className="mt-4 pt-4 border-t border-[var(--color-neutral-200)]">
                          <p className="font-medium text-[var(--color-neutral-800)] mb-2">返金計算:</p>
                          {refundCalc.shouldRefund ? (
                            <div className="bg-[var(--color-success-bg)] p-3 rounded border border-[var(--color-success-border)] space-y-1">
                              <p className="text-[var(--color-neutral-800)]">
                                使用期間: {refundCalc.usedMonths}ヶ月分 （{refundCalc.usedAmount}円）
                              </p>
                              <p className="text-lg font-bold text-[var(--color-success-text)]">
                                返金額: {refundCalc.refundAmount.toLocaleString()}円
                              </p>
                              <p className="text-xs text-[var(--color-neutral-600)] mt-2">
                                {refundCalc.reason}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-[var(--color-neutral-100)] p-3 rounded border border-[var(--color-neutral-200)]">
                              <p className="text-[var(--color-neutral-800)]">{refundCalc.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="mt-6 pt-6 border-t border-[var(--color-neutral-200)] flex gap-4">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 bg-[var(--color-success-text)] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:bg-[var(--color-neutral-400)] disabled:cursor-not-allowed"
                    >
                      {processing === request.id ? '処理中...' : '承認して解約処理を実行'}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 bg-[var(--color-error-text)] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:bg-[var(--color-neutral-400)] disabled:cursor-not-allowed"
                    >
                      {processing === request.id ? '処理中...' : '却下'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
