'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { isAdmin } from '@/lib/admin';

interface CancellationRequest {
  id: string;
  userId: string;
  reason: string | null;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 解約申請管理ページ
 */
export default function AdminCancellationRequestsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!isAdmin(session.user?.email)) {
      router.push('/dashboard');
      return;
    }

    loadRequests();
  }, [session, router]);

  const loadRequests = async () => {
    try {
      const response = await fetch('/api/admin/cancellation-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to load cancellation requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async (requestId: string, action: 'approve' | 'reject') => {
    if (!confirm(`この解約申請を${action === 'approve' ? '承認' : '拒否'}しますか？`)) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/admin/cancellation-requests/${requestId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await loadRequests(); // リロード
        alert(`解約申請を${action === 'approve' ? '承認' : '拒否'}しました`);
      } else {
        const data = await response.json();
        alert(data.error || '処理に失敗しました');
      }
    } catch (error) {
      console.error('Failed to process request:', error);
      alert('処理に失敗しました');
    } finally {
      setProcessingId(null);
    }
  };

  // フィルタリングされたリクエスト
  const filteredRequests = requests.filter((request) => {
    if (filterStatus === 'all') return true;
    return request.status === filterStatus;
  });

  // ステータス別集計
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  if (isLoading) {
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
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-neutral-900)]">
              解約申請管理
            </h1>
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
            <p className="text-xs text-[var(--color-neutral-600)] mb-1">総申請数</p>
            <p className="text-2xl font-bold text-[var(--color-neutral-900)]">
              {stats.total}
            </p>
          </div>
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
            <p className="text-xs text-[var(--color-neutral-600)] mb-1">処理待ち</p>
            <p className="text-2xl font-bold text-[var(--color-secondary-orange)]">
              {stats.pending}
            </p>
          </div>
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
            <p className="text-xs text-[var(--color-neutral-600)] mb-1">承認済み</p>
            <p className="text-2xl font-bold text-[var(--color-success-text)]">
              {stats.approved}
            </p>
          </div>
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
            <p className="text-xs text-[var(--color-neutral-600)] mb-1">拒否済み</p>
            <p className="text-2xl font-bold text-[var(--color-error-text)]">
              {stats.rejected}
            </p>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
            ステータスで絞り込み
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-64 px-4 py-3 border-2 border-[var(--color-neutral-300)] rounded-lg focus:border-[var(--color-primary-green)] focus:outline-none"
          >
            <option value="all">すべて</option>
            <option value="pending">処理待ち</option>
            <option value="approved">承認済み</option>
            <option value="rejected">拒否済み</option>
          </select>
        </div>

        {/* 解約申請一覧 */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
            解約申請一覧 ({filteredRequests.length})
          </h2>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Icon category="ui" name="calendar" size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-[var(--color-neutral-600)]">
                {filterStatus !== 'all'
                  ? '条件に一致する解約申請が見つかりません'
                  : '解約申請がありません'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-[var(--color-neutral-100)] rounded-lg p-5"
                >
                  {/* ヘッダー */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                        申請日時: {new Date(request.requestedAt).toLocaleString('ja-JP')}
                      </p>
                      <p className="text-xs text-[var(--color-neutral-600)]">
                        ユーザーID: {request.userId}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold self-start ${
                        request.status === 'pending'
                          ? 'bg-[var(--color-secondary-orange)] text-white'
                          : request.status === 'approved'
                          ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
                          : 'bg-[var(--color-error-bg)] text-[var(--color-error-text)]'
                      }`}
                    >
                      {request.status === 'pending'
                        ? '処理待ち'
                        : request.status === 'approved'
                        ? '承認済み'
                        : '拒否済み'}
                    </span>
                  </div>

                  {/* 理由 */}
                  {request.reason && (
                    <div className="mb-4 p-3 bg-white rounded-lg">
                      <p className="text-xs text-[var(--color-neutral-600)] mb-1">解約理由</p>
                      <p className="text-sm text-[var(--color-neutral-900)]">{request.reason}</p>
                    </div>
                  )}

                  {/* 処理情報 */}
                  {request.processedAt && (
                    <div className="mb-4 p-3 bg-white rounded-lg">
                      <p className="text-xs text-[var(--color-neutral-600)] mb-1">処理情報</p>
                      <p className="text-xs text-[var(--color-neutral-700)]">
                        処理日時: {new Date(request.processedAt).toLocaleString('ja-JP')}
                      </p>
                      {request.processedBy && (
                        <p className="text-xs text-[var(--color-neutral-700)]">
                          処理者: {request.processedBy}
                        </p>
                      )}
                    </div>
                  )}

                  {/* アクションボタン */}
                  {request.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="primary"
                        onClick={() => handleProcess(request.id, 'approve')}
                        disabled={processingId === request.id}
                        className="flex-1 bg-[var(--color-success-text)] hover:opacity-90"
                      >
                        {processingId === request.id ? '処理中...' : '承認'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleProcess(request.id, 'reject')}
                        disabled={processingId === request.id}
                        className="flex-1 border-[var(--color-error-text)] text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)]"
                      >
                        {processingId === request.id ? '処理中...' : '拒否'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
