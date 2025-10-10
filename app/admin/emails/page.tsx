'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/Layout';
import { Icon } from '@/components/Icon';
import { isAdmin } from '@/lib/admin';

interface EmailCampaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  targetType: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdBy: string;
  createdAt: string;
}

export default function EmailsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);

  // フォーム状態
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState('all');

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!isAdmin(session.user?.email)) {
      router.push('/dashboard');
      return;
    }

    fetchCampaigns();
  }, [session, router]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/email-campaigns');
      if (!response.ok) {
        throw new Error('キャンペーンの取得に失敗しました');
      }
      const data = await response.json();
      setCampaigns(data.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          content,
          targetType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'キャンペーンの作成に失敗しました');
      }

      // フォームをリセット
      setTitle('');
      setSubject('');
      setContent('');
      setTargetType('all');
      setShowCreateForm(false);

      // キャンペーン一覧を再取得
      await fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('このキャンペーンを送信しますか？')) {
      return;
    }

    setIsSending(campaignId);
    setError('');

    try {
      const response = await fetch(`/api/admin/email-campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'メール送信に失敗しました');
      }

      const data = await response.json();
      alert(
        `メール送信完了\n送信成功: ${data.sentCount}件\n送信失敗: ${data.failedCount}件`
      );

      // キャンペーン一覧を再取得
      await fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsSending(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-[var(--color-neutral-400)] text-white',
      scheduled: 'bg-[var(--color-neutral-600)] text-white',
      sending: 'bg-[var(--color-neutral-700)] text-white',
      sent: 'bg-[var(--color-neutral-800)] text-white',
      failed: 'bg-[var(--color-error-bg)] text-[var(--color-error-text)]',
    };

    const statusLabels: Record<string, string> = {
      draft: '下書き',
      scheduled: '予約済み',
      sending: '送信中',
      sent: '送信済み',
      failed: '失敗',
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded ${
          statusColors[status] || 'bg-[var(--color-neutral-400)] text-white'
        }`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  const getTargetTypeLabel = (targetType: string) => {
    const labels: Record<string, string> = {
      all: '全ユーザー',
      trial: 'トライアル',
      active: 'アクティブ',
      permanent: '永久ライセンス',
    };
    return labels[targetType] || targetType;
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
              メール配信管理
            </h1>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto px-4 py-2 bg-[var(--color-neutral-800)] text-white rounded-lg hover:bg-[var(--color-neutral-900)]"
          >
            新規作成
          </button>
        </div>

        {error && (
          <div className="bg-[var(--color-error-bg)] border border-[var(--color-error-text)] text-[var(--color-error-text)] px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* 統計 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--color-card-bg)] p-4 rounded-lg shadow">
            <div className="text-sm text-[var(--color-neutral-600)]">総キャンペーン数</div>
            <div className="text-2xl font-bold text-[var(--color-neutral-900)]">{campaigns.length}</div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-lg shadow">
            <div className="text-sm text-[var(--color-neutral-600)]">下書き</div>
            <div className="text-2xl font-bold text-[var(--color-neutral-900)]">
              {campaigns.filter((c) => c.status === 'draft').length}
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-lg shadow">
            <div className="text-sm text-[var(--color-neutral-600)]">送信済み</div>
            <div className="text-2xl font-bold text-[var(--color-neutral-900)]">
              {campaigns.filter((c) => c.status === 'sent').length}
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-lg shadow">
            <div className="text-sm text-[var(--color-neutral-600)]">総送信数</div>
            <div className="text-2xl font-bold text-[var(--color-neutral-900)]">
              {campaigns.reduce((sum, c) => sum + c.sentCount, 0)}
            </div>
          </div>
        </div>

        {/* キャンペーン一覧 */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
            キャンペーン一覧 ({campaigns.length})
          </h2>

          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Icon category="ui" name="edit" size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-[var(--color-neutral-600)]">
                キャンペーンがありません
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-[var(--color-neutral-100)] rounded-lg p-5 hover:bg-[var(--color-neutral-200)] transition-colors"
                >
                  {/* ヘッダー */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-[var(--color-neutral-900)] text-lg mb-1">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-[var(--color-neutral-600)]">
                        {campaign.subject}
                      </p>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>

                  {/* 詳細情報 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-[var(--color-neutral-600)]">配信対象</p>
                      <p className="text-sm font-medium text-[var(--color-neutral-900)]">
                        {getTargetTypeLabel(campaign.targetType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-neutral-600)]">送信数</p>
                      <p className="text-sm font-medium text-[var(--color-neutral-900)]">
                        {campaign.status === 'sent' || campaign.status === 'failed'
                          ? `${campaign.sentCount} / ${campaign.totalRecipients}`
                          : '-'}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-xs text-[var(--color-neutral-600)]">作成日時</p>
                      <p className="text-sm font-medium text-[var(--color-neutral-900)]">
                        {new Date(campaign.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                    <button
                      onClick={() => handleSendCampaign(campaign.id)}
                      disabled={isSending === campaign.id}
                      className="w-full sm:w-auto px-4 py-2 bg-[var(--color-neutral-800)] text-white text-sm rounded-lg hover:bg-[var(--color-neutral-900)] disabled:bg-[var(--color-neutral-400)]"
                    >
                      {isSending === campaign.id ? '送信中...' : '送信'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 新規作成モーダル */}
        {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--color-card-bg)] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-4">新規キャンペーン作成</h2>
              <form onSubmit={handleCreateCampaign}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1">
                      タイトル
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-neutral-500)]"
                      placeholder="例: 新機能のお知らせ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1">
                      メール件名
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-neutral-500)]"
                      placeholder="例: 【Kigasuru】新機能リリースのお知らせ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1">
                      配信対象
                    </label>
                    <select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-neutral-500)]"
                    >
                      <option value="all">全ユーザー</option>
                      <option value="trial">トライアルユーザー</option>
                      <option value="active">アクティブユーザー</option>
                      <option value="permanent">永久ライセンスユーザー</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1">
                      メール本文（HTML可）
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={10}
                      className="w-full px-3 py-2 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-neutral-500)] font-mono text-sm"
                      placeholder={`<h1>新機能のお知らせ</h1>
<p>いつもKigasuruをご利用いただきありがとうございます。</p>
<p>この度、以下の新機能をリリースいたしました：</p>
<ul>
  <li>機能1</li>
  <li>機能2</li>
</ul>`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-[var(--color-neutral-600)] text-white rounded-lg hover:bg-[var(--color-neutral-700)]"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-neutral-800)] text-white rounded-lg hover:bg-[var(--color-neutral-900)]"
                  >
                    作成
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}
      </div>
    </Layout>
  );
}
