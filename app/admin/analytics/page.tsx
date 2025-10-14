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

  // 検索処理（リアルタイム検索）
  useEffect(() => {
    const searchUser = async () => {
      if (!searchQuery.trim()) {
        setSearchedUser(null);
        return;
      }

      try {
        const response = await fetch(`/api/admin/analytics?email=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchedUser(data.searchedUser);
        } else {
          console.error('Search error');
          setSearchedUser(null);
        }
      } catch (error) {
        console.error('Failed to search user:', error);
        setSearchedUser(null);
      }
    };

    // デバウンス処理
    const timeoutId = setTimeout(() => {
      searchUser();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[var(--color-neutral-100)] rounded-lg p-3">
          <p className="text-xs text-[var(--color-neutral-600)] mb-1 text-center">
            ショット数
          </p>
          <p className="text-2xl font-bold text-[var(--color-primary-green)] text-center">
            {user._count.shots}
          </p>
        </div>
        <div className="bg-[var(--color-neutral-100)] rounded-lg p-3">
          <p className="text-xs text-[var(--color-neutral-600)] mb-1 text-center">
            サブスク
          </p>
          <p className="text-2xl font-bold text-[var(--color-secondary-blue)] text-center">
            {user._count.subscriptions}
          </p>
        </div>
        <div className="bg-[var(--color-neutral-100)] rounded-lg p-3">
          <p className="text-xs text-[var(--color-neutral-600)] mb-1 text-center">
            支払い
          </p>
          <p className="text-2xl font-bold text-[var(--color-secondary-orange)] text-center">
            {user._count.payments}
          </p>
        </div>
      </div>

      {/* サブスクリプション履歴 */}
      {user.subscriptions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-bold text-[var(--color-neutral-900)] mb-2 flex items-center gap-1">
            <svg
              className="w-4 h-4 text-[var(--color-secondary-blue)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            サブスクリプション履歴
          </h4>
          <div className="space-y-2">
            {user.subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-[var(--color-neutral-100)] rounded-lg p-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base font-bold text-[var(--color-neutral-900)]">
                    {sub.plan}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      sub.status === 'active'
                        ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
                        : 'bg-[var(--color-neutral-300)] text-[var(--color-neutral-700)]'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-neutral-600)]">
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
          <h4 className="text-sm font-bold text-[var(--color-neutral-900)] mb-2 flex items-center gap-1">
            <svg
              className="w-4 h-4 text-[var(--color-secondary-orange)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            支払い履歴
          </h4>
          <div className="space-y-2">
            {user.payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-[var(--color-neutral-100)] rounded-lg p-3 flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[var(--color-secondary-orange)]">
                    ¥{payment.amount.toLocaleString()}
                  </span>
                  <span className="text-sm text-[var(--color-neutral-600)]">
                    {payment.plan || '不明'}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-neutral-500)]">
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
        size="md"
        onClick={() => handleOpenDetailModal(user)}
        className="group w-full hover:bg-[var(--color-primary-green)] hover:text-white flex items-center justify-center"
      >
        <Icon
          category="ui"
          name="analysis"
          size={18}
          style={{ filter: 'invert(37%) sepia(93%) saturate(370%) hue-rotate(54deg) brightness(94%) contrast(97%)' }}
          className="mr-1 group-hover:!brightness-0 group-hover:!invert transition-all"
        />
        詳細統計を表示
      </Button>
    </div>
  );

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
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 mb-6">
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
