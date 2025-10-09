'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { isAdmin } from '@/lib/admin';

interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    shots: number;
    subscriptions: number;
    payments: number;
  };
}

/**
 * ユーザー管理ページ
 */
export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [grantReason, setGrantReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [revokeUser, setRevokeUser] = useState<User | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!isAdmin(session.user?.email)) {
      router.push('/dashboard');
      return;
    }

    loadUsers();
  }, [session, router]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantPermanent = async () => {
    if (!selectedUser) return;

    if (!confirm(`${selectedUser.email} に永久利用権を付与しますか？`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/grant-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: grantReason,
        }),
      });

      if (response.ok) {
        alert('永久利用権を付与しました');
        setSelectedUser(null);
        setGrantReason('');
        loadUsers();
      } else {
        alert('永久利用権の付与に失敗しました');
      }
    } catch (error) {
      console.error('Failed to grant permanent:', error);
      alert('エラーが発生しました');
    }
  };

  const handleRevokePermanent = async () => {
    if (!revokeUser) return;

    try {
      const response = await fetch('/api/admin/revoke-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: revokeUser.id,
        }),
      });

      if (response.ok) {
        alert('永久利用権を解除しました');
        setRevokeUser(null);
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.error || '永久利用権の解除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to revoke permanent:', error);
      alert('エラーが発生しました');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: deleteConfirmUser.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'ユーザーを削除しました');
        setDeleteConfirmUser(null);
        loadUsers();
      } else {
        alert(data.error || 'ユーザー削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('エラーが発生しました');
    } finally {
      setIsDeleting(false);
    }
  };

  // フィルタリングされたユーザー一覧
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' || user.subscriptionStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // 検索・フィルターが適用されていない場合は最新20人のみ表示
  const displayUsers = searchQuery || filterStatus !== 'all'
    ? filteredUsers
    : filteredUsers.slice(0, 20);

  const isLimitedView = !searchQuery && filterStatus === 'all' && filteredUsers.length > 20;

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
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-[var(--color-neutral-200)] rounded-lg transition-colors"
            >
              <Icon category="ui" name="back" size={24} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-neutral-900)]">
              ユーザー管理
            </h1>
          </div>
          <div className="text-sm text-[var(--color-neutral-600)]">
            総ユーザー数: {users.length}
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
                <option value="trial">トライアル</option>
                <option value="active">有料ユーザー</option>
                <option value="permanent">永久利用権</option>
                <option value="expired">期限切れ</option>
              </select>
            </div>
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
            ユーザー一覧 ({displayUsers.length}{isLimitedView && ` / ${filteredUsers.length}`})
          </h2>

          {isLimitedView && (
            <div className="mb-4 bg-[var(--color-info-border)] border border-[var(--color-secondary-blue)] rounded-lg p-3">
              <p className="text-sm text-[var(--color-info-text)]">
                <Icon category="ui" name="info" size={16} className="inline mr-1" style={{ filter: 'invert(23%) sepia(29%) saturate(1825%) hue-rotate(185deg) brightness(95%) contrast(96%)' }} />
                最新の20人を表示しています。他のユーザーを表示するには、検索またはステータスフィルターを使用してください。
              </p>
            </div>
          )}

          {displayUsers.length === 0 ? (
            <div className="text-center py-12">
              <Icon
                category="ui"
                name="user"
                size={48}
                className="mx-auto mb-4 opacity-30"
              />
              <p className="text-[var(--color-neutral-600)]">
                {searchQuery || filterStatus !== "all"
                  ? "条件に一致するユーザーが見つかりません"
                  : "ユーザーがいません"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {displayUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-[var(--color-neutral-100)] rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-[var(--color-neutral-900)]">
                          {user.name || "名前なし"}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                            user.subscriptionStatus === "permanent"
                              ? "bg-[var(--color-secondary-orange)] text-white"
                              : user.subscriptionStatus === "active"
                                ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                                : user.subscriptionStatus === "trial"
                                  ? "bg-[var(--color-info-bg)] text-[var(--color-info-text)]"
                                  : "bg-[var(--color-neutral-300)] text-[var(--color-neutral-700)]"
                          }`}
                        >
                          {user.subscriptionStatus === "permanent"
                            ? "永久"
                            : user.subscriptionStatus === "active"
                              ? "有料"
                              : user.subscriptionStatus === "trial"
                                ? "トライアル"
                                : user.subscriptionStatus}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-neutral-600)]">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[var(--color-neutral-600)] mb-3">
                    <div>ショット: {user._count.shots}</div>
                    <div>サブスク: {user._count.subscriptions}</div>
                    <div>支払い: {user._count.payments}</div>
                    <div>
                      登録:{" "}
                      {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                    </div>
                  </div>

                  {user.trialEndsAt && (
                    <p className="text-xs text-[var(--color-neutral-600)] mb-2">
                      トライアル終了:{" "}
                      {new Date(user.trialEndsAt).toLocaleDateString("ja-JP")}
                    </p>
                  )}

                  {user.subscriptionEndsAt && (
                    <p className="text-xs text-[var(--color-neutral-600)] mb-2">
                      サブスク終了:{" "}
                      {new Date(user.subscriptionEndsAt).toLocaleDateString(
                        "ja-JP"
                      )}
                    </p>
                  )}

                  {user.stripeCustomerId && (
                    <p className="text-xs text-[var(--color-neutral-500)] mb-2 font-mono">
                      Stripe: {user.stripeCustomerId}
                    </p>
                  )}

                  {!isAdmin(user.email) && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {user.subscriptionStatus !== "permanent" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="group flex-1 text-xs hover:bg-[var(--color-primary-green)] hover:text-white w-full sm:w-auto flex items-center justify-center"
                        >
                          <Icon
                            category="ui"
                            name="check"
                            size={16}
                            style={{ filter: 'invert(37%) sepia(93%) saturate(370%) hue-rotate(54deg) brightness(94%) contrast(97%)' }}
                            className="mr-1 group-hover:!brightness-0 group-hover:!invert transition-all"
                          />
                          永久利用権を付与
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRevokeUser(user)}
                          className="group flex-1 text-xs border-[var(--color-secondary-orange)] text-[var(--color-secondary-orange)] hover:bg-[var(--color-secondary-orange)] hover:text-white w-full sm:w-auto flex items-center justify-center"
                        >
                          <Icon
                            category="ui"
                            name="close"
                            size={16}
                            style={{ filter: 'invert(45%) sepia(74%) saturate(1846%) hue-rotate(360deg) brightness(95%) contrast(99%)' }}
                            className="mr-1 group-hover:!brightness-0 group-hover:!invert transition-all"
                          />
                          永久利用権を解除
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmUser(user)}
                        className="group text-xs border-[var(--color-secondary-red)] text-[var(--color-secondary-red)] hover:bg-[var(--color-secondary-red)] hover:text-white w-full sm:w-auto flex items-center justify-center"
                      >
                        <Icon
                          category="ui"
                          name="delete"
                          size={16}
                          style={{ filter: 'invert(17%) sepia(73%) saturate(2529%) hue-rotate(336deg) brightness(88%) contrast(93%)' }}
                          className="mr-1 group-hover:!brightness-0 group-hover:!invert transition-all"
                        />
                        削除
                      </Button>
                    </div>
                  )}
                  {isAdmin(user.email) && (
                    <div className="bg-[var(--color-info-bg)] border border-[var(--color-info-text)] rounded-lg p-2 text-center">
                      <p className="text-xs text-[var(--color-info-text)] font-medium flex items-center justify-center">
                        <Icon
                          category="ui"
                          name="settings"
                          size={14}
                          style={{ filter: 'invert(23%) sepia(29%) saturate(1825%) hue-rotate(185deg) brightness(95%) contrast(96%)' }}
                          className="mr-1"
                        />
                        管理者アカウント
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 永久利用権付与ダイアログ */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <div className="bg-[var(--color-card-bg)] rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon category="ui" name="check" size={24} />
                永久利用権の付与
              </h2>
              <p className="text-sm text-[var(--color-neutral-600)] mb-4">
                <strong>{selectedUser.email}</strong> に永久利用権を付与します
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                  理由（任意）
                </label>
                <textarea
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="例：テストユーザー、特別対応など"
                  className="w-full px-4 py-3 border-2 border-[var(--color-neutral-300)] rounded-lg focus:border-[var(--color-primary-green)] focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(null);
                    setGrantReason("");
                  }}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGrantPermanent}
                  className="flex-1 bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)]"
                >
                  付与する
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 永久利用権解除確認ダイアログ */}
        {revokeUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <div className="bg-[var(--color-card-bg)] rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-secondary-orange)]">
                <Icon category="ui" name="close" size={24} />
                永久利用権の解除
              </h2>
              <div className="mb-6">
                <p className="text-sm text-[var(--color-neutral-700)] mb-2">
                  以下のユーザーの永久利用権を解除しようとしています：
                </p>
                <div className="bg-[var(--color-neutral-100)] rounded-lg p-4 mb-2">
                  <p className="font-bold text-[var(--color-neutral-900)]">
                    {revokeUser.name || '名前なし'}
                  </p>
                  <p className="text-sm text-[var(--color-neutral-600)]">
                    {revokeUser.email}
                  </p>
                </div>
                <div className="bg-orange-100 border border-[var(--color-secondary-orange)] rounded-lg p-3">
                  <p className="text-sm text-[var(--color-secondary-orange)] font-bold">
                    ⚠️ 注意
                  </p>
                  <p className="text-xs text-[var(--color-neutral-700)] mt-1 text-justify">
                    永久利用権を解除すると、ユーザーのサブスクリプションステータスが「期限切れ」になります。再度アクセスするには、新たにサブスクリプションを契約する必要があります。
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRevokeUser(null)}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRevokePermanent}
                  className="flex-1 bg-[var(--color-secondary-orange)] hover:bg-orange-700 text-white"
                >
                  解除する
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ユーザー削除確認ダイアログ */}
        {deleteConfirmUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <div className="bg-[var(--color-card-bg)] rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-secondary-red)]">
                <Icon category="ui" name="delete" size={24} />
                ユーザー削除の確認
              </h2>
              <div className="mb-6">
                <p className="text-sm text-[var(--color-neutral-700)] mb-2">
                  以下のユーザーを削除しようとしています：
                </p>
                <div className="bg-[var(--color-neutral-100)] rounded-lg p-4 mb-2">
                  <p className="font-bold text-[var(--color-neutral-900)]">
                    {deleteConfirmUser.name || "名前なし"}
                  </p>
                  <p className="text-sm text-[var(--color-neutral-600)]">
                    {deleteConfirmUser.email}
                  </p>
                </div>
                <div className="bg-[var(--color-error-border)] border border-red-700 rounded-lg p-3">
                  <p className="text-sm text-[var(--color-secondary-red)] font-bold">
                    ⚠️ 警告
                  </p>
                  <p className="text-xs text-red-700 mt-1 text-justify">
                    この操作は取り消せません。ユーザーのすべてのデータ（ショット記録、サブスクリプション情報など）が完全に削除されます。
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmUser(null)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 bg-[var(--color-secondary-red)] hover:bg-red-900 text-white"
                >
                  {isDeleting ? "削除中..." : "削除する"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
