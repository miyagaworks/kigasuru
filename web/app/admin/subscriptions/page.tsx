'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Icon } from '@/components/Icon';
import { isAdmin } from '@/lib/admin';

interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

interface UserWithSubscription {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  trialEndsAt: string | null;
  subscriptionStatus: string;
  subscriptionEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscription: SubscriptionData | null;
}

/**
 * サブスクリプション管理ページ
 */
export default function AdminSubscriptionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

    loadSubscriptions();
  }, [session, router]);

  const loadSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // フィルタリングされたユーザー一覧
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'subscribed' && user.subscription !== null) ||
      (filterStatus === 'trial' && user.subscriptionStatus === 'trial') ||
      (filterStatus === 'active' && user.subscriptionStatus === 'active') ||
      (filterStatus === 'permanent' && user.subscriptionStatus === 'permanent') ||
      (filterStatus === 'expired' && user.subscriptionStatus === 'expired');

    return matchesSearch && matchesFilter;
  });

  // ステータス別集計
  const stats = {
    total: users.length,
    subscribed: users.filter((u) => u.subscription !== null).length,
    active: users.filter((u) => u.subscriptionStatus === 'active').length,
    trial: users.filter((u) => u.subscriptionStatus === 'trial').length,
    permanent: users.filter((u) => u.subscriptionStatus === 'permanent').length,
    expired: users.filter((u) => u.subscriptionStatus === 'expired').length,
  };

  if (isLoading) {
    return (
      <Layout showNav={true}>
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
    <Layout showNav={true}>
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
              サブスクリプション管理
            </h1>
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
            <p className="text-xs text-[var(--color-neutral-600)] mb-1">総ユーザー</p>
            <p className="text-2xl font-bold text-[var(--color-neutral-900)]">
              {stats.total}
            </p>
          </div>
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
            <p className="text-xs text-[var(--color-neutral-600)] mb-1">サブスク有</p>
            <p className="text-2xl font-bold text-[var(--color-primary-green)]">
              {stats.subscribed}
            </p>
          </div>
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
            <p className="text-xs text-[var(--color-neutral-600)] mb-1">有料</p>
            <p className="text-2xl font-bold text-[var(--color-success-text)]">
              {stats.active}
            </p>
          </div>
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
            <p className="text-xs text-[var(--color-neutral-600)] mb-1">トライアル</p>
            <p className="text-2xl font-bold text-[var(--color-secondary-blue)]">
              {stats.trial}
            </p>
          </div>
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
            <p className="text-xs text-[var(--color-neutral-600)] mb-1">永久</p>
            <p className="text-2xl font-bold text-[var(--color-secondary-orange)]">
              {stats.permanent}
            </p>
          </div>
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
            <p className="text-xs text-[var(--color-neutral-600)] mb-1">期限切れ</p>
            <p className="text-2xl font-bold text-[var(--color-error-text)]">
              {stats.expired}
            </p>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="名前またはメールアドレスで検索"
                className="w-full px-4 py-3 border-2 border-[var(--color-neutral-300)] rounded-lg focus:border-[var(--color-primary-green)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                ステータスで絞り込み
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[var(--color-neutral-300)] rounded-lg focus:border-[var(--color-primary-green)] focus:outline-none"
              >
                <option value="all">すべて</option>
                <option value="subscribed">サブスクリプション有</option>
                <option value="trial">トライアル</option>
                <option value="active">有料ユーザー</option>
                <option value="permanent">永久利用権</option>
                <option value="expired">期限切れ</option>
              </select>
            </div>
          </div>
        </div>

        {/* サブスクリプション一覧 */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
            サブスクリプション一覧 ({filteredUsers.length})
          </h2>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Icon category="ui" name="calendar" size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-[var(--color-neutral-600)]">
                {searchQuery || filterStatus !== 'all'
                  ? '条件に一致するユーザーが見つかりません'
                  : 'サブスクリプションがありません'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-[var(--color-neutral-100)] rounded-lg p-5 hover:bg-[var(--color-neutral-200)] transition-colors"
                >
                  {/* ユーザー情報 */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-[var(--color-neutral-900)] text-lg">
                        {user.name || '名前なし'}
                      </p>
                      <p className="text-sm text-[var(--color-neutral-600)]">
                        {user.email}
                      </p>
                      <p className="text-xs text-[var(--color-neutral-500)] mt-1">
                        登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold self-start ${
                        user.subscriptionStatus === 'permanent'
                          ? 'bg-[var(--color-secondary-orange)] text-white'
                          : user.subscriptionStatus === 'active'
                          ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
                          : user.subscriptionStatus === 'trial'
                          ? 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]'
                          : 'bg-[var(--color-neutral-300)] text-[var(--color-neutral-700)]'
                      }`}
                    >
                      {user.subscriptionStatus === 'permanent'
                        ? '永久利用権'
                        : user.subscriptionStatus === 'active'
                        ? '有料会員'
                        : user.subscriptionStatus === 'trial'
                        ? 'トライアル'
                        : user.subscriptionStatus}
                    </span>
                  </div>

                  {/* Stripe情報 */}
                  {user.stripeCustomerId && (
                    <div className="mb-3 p-3 bg-white rounded-lg">
                      <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                        Stripe Customer ID
                      </p>
                      <p className="text-xs font-mono text-[var(--color-neutral-800)]">
                        {user.stripeCustomerId}
                      </p>
                    </div>
                  )}

                  {/* サブスクリプション詳細 */}
                  {user.subscription ? (
                    <div className="border-t-2 border-[var(--color-neutral-300)] pt-3">
                      <h3 className="text-sm font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                        <Icon category="ui" name="calendar" size={16} />
                        サブスクリプション詳細
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[var(--color-neutral-600)]">プラン</p>
                          <p className="text-sm font-bold text-[var(--color-neutral-900)]">
                            {user.subscription.plan === 'yearly' ? '年額プラン' : '月額プラン'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-neutral-600)]">ステータス</p>
                          <p className="text-sm font-bold text-[var(--color-neutral-900)]">
                            {user.subscription.status}
                            {user.subscription.cancelAtPeriodEnd && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-[var(--color-error-bg)] text-[var(--color-error-text)] rounded">
                                解約予定
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-neutral-600)]">開始日</p>
                          <p className="text-sm text-[var(--color-neutral-900)]">
                            {new Date(user.subscription.currentPeriodStart).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-neutral-600)]">終了日</p>
                          <p className="text-sm text-[var(--color-neutral-900)]">
                            {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>

                      {user.subscription.stripeSubscriptionId && (
                        <div className="mt-3 p-3 bg-white rounded-lg">
                          <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                            Stripe Subscription ID
                          </p>
                          <p className="text-xs font-mono text-[var(--color-neutral-800)]">
                            {user.subscription.stripeSubscriptionId}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-t-2 border-[var(--color-neutral-300)] pt-3">
                      <p className="text-sm text-[var(--color-neutral-600)] text-center py-4">
                        サブスクリプション情報がありません
                      </p>
                      {user.trialEndsAt && (
                        <p className="text-xs text-[var(--color-neutral-600)] text-center">
                          トライアル終了: {new Date(user.trialEndsAt).toLocaleDateString('ja-JP')}
                        </p>
                      )}
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
