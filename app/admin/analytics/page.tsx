'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { isAdmin } from '@/lib/admin';
import { UserDetailModal } from '@/components/UserDetailModal';

interface Shot {
  id: string;
  date: Date;
  club: string;
  distance: number;
  createdAt: Date;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  plan: string | null;
  createdAt: Date;
}

interface UserAnalytics {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  stripeCustomerId: string | null;
  createdAt: Date;
  _count: {
    shots: number;
    subscriptions: number;
    payments: number;
  };
  shots: Shot[];
  subscriptions: Subscription[];
  payments?: Payment[];
}

/**
 * 使用状況分析ページ
 */
export default function AdminAnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [recentUsers, setRecentUsers] = useState<UserAnalytics[]>([]);
  const [searchedUser, setSearchedUser] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string | null; email: string } | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!isAdmin(session.user?.email)) {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [session, router]);

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const data = await response.json();
        setRecentUsers(data.recentUsers);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/analytics?email=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchedUser(data.searchedUser);
        if (!data.searchedUser) {
          alert('ユーザーが見つかりませんでした');
        }
      }
    } catch (error) {
      console.error('Failed to search user:', error);
      alert('検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchedUser(null);
  };

  const handleOpenDetailModal = (user: UserAnalytics) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedUser(null);
  };

  const renderUserCard = (user: UserAnalytics, isSearchResult = false) => (
    <div
      key={user.id}
      className={`bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 ${isSearchResult ? 'border-2 border-[var(--color-primary-green)]' : ''}`}
    >
      {/* ユーザー情報 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-[var(--color-neutral-900)]">
              {user.name || '名前なし'}
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
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
                ? '永久'
                : user.subscriptionStatus === 'active'
                  ? '有料'
                  : user.subscriptionStatus === 'trial'
                    ? 'トライアル'
                    : user.subscriptionStatus}
            </span>
          </div>
          <p className="text-sm text-[var(--color-neutral-600)]">{user.email}</p>
          <p className="text-xs text-[var(--color-neutral-500)] mt-1">
            登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
          </p>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-[var(--color-neutral-100)] rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-[var(--color-primary-green)]">
            {user._count.shots}
          </p>
          <p className="text-xs text-[var(--color-neutral-600)]">ショット数</p>
        </div>
        <div className="bg-[var(--color-neutral-100)] rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-[var(--color-secondary-blue)]">
            {user._count.subscriptions}
          </p>
          <p className="text-xs text-[var(--color-neutral-600)]">サブスク</p>
        </div>
        <div className="bg-[var(--color-neutral-100)] rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-[var(--color-secondary-orange)]">
            {user._count.payments}
          </p>
          <p className="text-xs text-[var(--color-neutral-600)]">支払い</p>
        </div>
      </div>

      {/* 最近のショット */}
      {user.shots.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-bold text-[var(--color-neutral-900)] mb-2">
            最近のショット
          </h4>
          <div className="space-y-2">
            {user.shots.map((shot) => (
              <div
                key={shot.id}
                className="bg-[var(--color-neutral-100)] rounded-lg p-2 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-bold">{shot.club}</span>
                  <span className="text-[var(--color-neutral-600)] ml-2">
                    {shot.distance}yd
                  </span>
                </div>
                <span className="text-[var(--color-neutral-500)]">
                  {new Date(shot.date).toLocaleDateString('ja-JP')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* サブスクリプション履歴 */}
      {user.subscriptions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-bold text-[var(--color-neutral-900)] mb-2">
            サブスクリプション履歴
          </h4>
          <div className="space-y-2">
            {user.subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-[var(--color-neutral-100)] rounded-lg p-2 text-xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{sub.plan}</span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      sub.status === 'active'
                        ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
                        : 'bg-[var(--color-neutral-300)] text-[var(--color-neutral-700)]'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
                <p className="text-[var(--color-neutral-600)]">
                  {new Date(sub.startDate).toLocaleDateString('ja-JP')}
                  {sub.endDate && ` ~ ${new Date(sub.endDate).toLocaleDateString('ja-JP')}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 支払い履歴（検索結果の場合のみ表示） */}
      {isSearchResult && user.payments && user.payments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-bold text-[var(--color-neutral-900)] mb-2">
            支払い履歴
          </h4>
          <div className="space-y-2">
            {user.payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-[var(--color-neutral-100)] rounded-lg p-2 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-bold">¥{payment.amount.toLocaleString()}</span>
                  <span className="text-[var(--color-neutral-600)] ml-2">
                    {payment.plan || '不明'}
                  </span>
                </div>
                <span className="text-[var(--color-neutral-500)]">
                  {new Date(payment.createdAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 詳細ボタン */}
      <Button
        variant="outline"
        onClick={() => handleOpenDetailModal(user)}
        className="w-full flex items-center justify-center gap-2"
      >
        <Icon category="ui" name="analysis" size={16} />
        詳細統計を表示
      </Button>
    </div>
  );

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
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-[var(--color-neutral-200)] rounded-lg transition-colors"
          >
            <Icon category="ui" name="back" size={24} />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-neutral-900)]">
            使用状況分析
          </h1>
        </div>

        {/* 検索フォーム */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                ユーザー検索
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="メールアドレスで検索"
                  className="flex-1 px-4 py-3 border-2 border-[var(--color-neutral-300)] rounded-lg focus:border-[var(--color-primary-green)] focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6"
                >
                  {isSearching ? '検索中...' : '検索'}
                </Button>
                {searchedUser && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearSearch}
                  >
                    クリア
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* 検索結果 */}
        {searchedUser && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
              検索結果
            </h2>
            {renderUserCard(searchedUser, true)}
          </div>
        )}

        {/* 新規ユーザー10人 */}
        <div>
          <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
            新規ユーザー（最新10人）
          </h2>
          {recentUsers.length === 0 ? (
            <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-12 text-center">
              <Icon
                category="ui"
                name="user"
                size={48}
                className="mx-auto mb-4 opacity-30"
              />
              <p className="text-[var(--color-neutral-600)]">ユーザーがいません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentUsers.map((user) => renderUserCard(user))}
            </div>
          )}
        </div>

        {/* 詳細統計モーダル */}
        {selectedUser && (
          <UserDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseDetailModal}
            userId={selectedUser.id}
            userName={selectedUser.name}
            userEmail={selectedUser.email}
          />
        )}
      </div>
    </Layout>
  );
}
