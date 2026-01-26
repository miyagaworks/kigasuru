'use client';

import { useEffect, useState, useCallback } from 'react';
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
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const USERS_PER_PAGE = 20;

type SortField = 'shots' | 'subscriptions' | 'payments' | 'createdAt';
type SortOrder = 'asc' | 'desc';

/**
 * 使用状況分析ページ
 */
export default function AdminAnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 検索クエリのデバウンス
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(async (page: number, search: string, sort: SortField, order: SortOrder) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: USERS_PER_PAGE.toString(),
        search,
        sortBy: sort,
        sortOrder: order,
      });
      const response = await fetch(`/api/admin/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!isAdmin(session.user?.email)) {
      router.push('/dashboard');
      return;
    }

    loadData(currentPage, debouncedSearch, sortBy, sortOrder);
  }, [session, router, currentPage, debouncedSearch, sortBy, sortOrder, loadData]);

  // フィルターや検索が変わったらページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sortBy, sortOrder]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (field: SortField) => {
    if (sortBy === field) {
      // 同じフィールドの場合は順序を反転
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
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

  const renderUserCard = (user: UserAnalytics) => (
    <div
      key={user.id}
      className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6"
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
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-neutral-900)] flex items-center gap-2">
            <Icon category="ui" name="analysis" size={28} />
            使用状況分析
          </h1>
        </div>

        {/* 検索・ソートフォーム */}
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
                並べ替え
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { field: 'shots' as SortField, label: 'ショット数' },
                  { field: 'subscriptions' as SortField, label: 'サブスク' },
                  { field: 'payments' as SortField, label: '支払い' },
                  { field: 'createdAt' as SortField, label: '登録日' },
                ].map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => handleSortChange(field)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                      sortBy === field
                        ? 'bg-[var(--color-primary-green)] text-white'
                        : 'bg-[var(--color-neutral-200)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-300)]'
                    }`}
                  >
                    {label}
                    {sortBy === field && (
                      <span className="text-xs">
                        {sortOrder === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
            <h2 className="text-lg font-bold text-[var(--color-neutral-900)]">
              ユーザー一覧 ({users.length}件{pagination && ` / 全${pagination.total}件`})
            </h2>
          </div>
          {users.length === 0 ? (
            <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-12 text-center">
              <Icon
                category="ui"
                name="user"
                size={48}
                className="mx-auto mb-4 opacity-30"
              />
              <p className="text-[var(--color-neutral-600)]">
                {debouncedSearch
                  ? '条件に一致するユーザーが見つかりません'
                  : 'ユーザーがいません'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user) => renderUserCard(user))}
              </div>

              {/* ページネーション */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-[var(--color-neutral-600)]">
                    ページ {pagination.page} / {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => handlePageChange(1)}
                      disabled={!pagination.hasPrev || isLoading}
                      className="px-3"
                    >
                      最初
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev || isLoading}
                      className="px-3"
                    >
                      <Icon category="ui" name="back" size={18} />
                      前へ
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter((pageNum) => {
                          const current = pagination.page;
                          return (
                            pageNum === 1 ||
                            pageNum === pagination.totalPages ||
                            (pageNum >= current - 2 && pageNum <= current + 2)
                          );
                        })
                        .map((pageNum, index, arr) => {
                          const showEllipsisBefore = index > 0 && pageNum - arr[index - 1] > 1;
                          return (
                            <div key={pageNum} className="flex items-center">
                              {showEllipsisBefore && (
                                <span className="px-2 text-[var(--color-neutral-500)]">...</span>
                              )}
                              <button
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isLoading}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                  pageNum === pagination.page
                                    ? 'bg-[var(--color-primary-green)] text-white'
                                    : 'hover:bg-[var(--color-neutral-200)] text-[var(--color-neutral-700)]'
                                }`}
                              >
                                {pageNum}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext || isLoading}
                      className="px-3"
                    >
                      次へ
                      <Icon category="ui" name="forward" size={18} />
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={!pagination.hasNext || isLoading}
                      className="px-3"
                    >
                      最後
                    </Button>
                  </div>
                </div>
              )}
            </>
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
