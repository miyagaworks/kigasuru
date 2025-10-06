'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Icon } from '@/components/Icon';
import { isAdmin } from '@/lib/admin';

interface Stats {
  users: {
    total: number;
    trial: number;
    active: number;
    permanent: number;
    recent: number;
  };
  shots: {
    total: number;
    averagePerUser: number;
  };
  payments: {
    total: number;
    totalAmount: number;
  };
  plans: Array<{
    plan: string;
    count: number;
  }>;
}

interface SystemInfo {
  totalUsers: number;
  activeSubscriptions: number;
  pendingRequests: number;
  lastUpdate: string;
}

interface AdminMenuCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
  badge?: string;
  disabled?: boolean;
}

/**
 * 管理メニューカードコンポーネント
 */
const AdminMenuCard = ({
  title,
  icon,
  description,
  onClick,
  badge,
  disabled = false,
}: AdminMenuCardProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full p-6 rounded-xl border-2 transition-all duration-200 text-left
      ${
        disabled
          ? 'bg-[var(--color-neutral-200)] border-[var(--color-neutral-300)] cursor-not-allowed opacity-60'
          : 'bg-[var(--color-card-bg)] border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-400)] hover:shadow-lg cursor-pointer'
      }
    `}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className={`
          p-3 rounded-lg
          ${disabled ? 'bg-[var(--color-neutral-300)]' : 'bg-[var(--color-neutral-100)]'}
        `}>
          {icon}
        </div>
        <h3 className={`
          text-lg font-bold
          ${disabled ? 'text-[var(--color-neutral-500)]' : 'text-[var(--color-neutral-900)]'}
        `}>
          {title}
        </h3>
      </div>
      {badge && (
        <span className="bg-[var(--color-error-bg)] text-[var(--color-error-text)] px-3 py-1 rounded-full text-xs font-bold">
          {badge}
        </span>
      )}
    </div>
    <p className={`
      text-sm
      ${disabled ? 'text-[var(--color-neutral-500)]' : 'text-[var(--color-neutral-600)]'}
    `}>
      {description}
    </p>
  </button>
);

/**
 * 管理者専用ダッシュボード
 */
export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const [statsRes, systemInfoRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/system-info'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (systemInfoRes.ok) {
        const systemInfoData = await systemInfoRes.json();
        setSystemInfo(systemInfoData);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
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
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-neutral-900)] mb-6 flex items-center gap-2">
          <Icon category="ui" name="settings" size={28} />
          管理ダッシュボード
        </h1>

        {/* システム情報サマリー */}
        {systemInfo && (
          <div className="mb-8 bg-[var(--color-neutral-100)] border border-[var(--color-neutral-200)] rounded-lg p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <p className="text-xs text-[var(--color-neutral-600)] mb-1 font-medium">総ユーザー数</p>
                <p className="text-3xl font-bold text-[var(--color-neutral-900)]">
                  {systemInfo.totalUsers}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-neutral-600)] mb-1 font-medium">アクティブサブスク</p>
                <p className="text-3xl font-bold text-[var(--color-neutral-900)]">
                  {systemInfo.activeSubscriptions}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-neutral-600)] mb-1 font-medium">未処理申請</p>
                <p className="text-3xl font-bold text-[var(--color-neutral-900)]">
                  {systemInfo.pendingRequests}
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-neutral-500)] mt-4">
              最終更新: {systemInfo.lastUpdate}
            </p>
          </div>
        )}

        {/* 統計サマリー */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
              使用状況統計
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
                <p className="text-xs text-[var(--color-neutral-600)] mb-1">総ユーザー数</p>
                <p className="text-2xl font-bold text-[var(--color-neutral-900)]">
                  {stats.users.total}
                </p>
              </div>
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
                <p className="text-xs text-[var(--color-neutral-600)] mb-1">トライアル</p>
                <p className="text-2xl font-bold text-[var(--color-neutral-900)]">
                  {stats.users.trial}
                </p>
              </div>
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
                <p className="text-xs text-[var(--color-neutral-600)] mb-1">有料ユーザー</p>
                <p className="text-2xl font-bold text-[var(--color-neutral-900)]">
                  {stats.users.active}
                </p>
              </div>
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
                <p className="text-xs text-[var(--color-neutral-600)] mb-1">永久利用権</p>
                <p className="text-2xl font-bold text-[var(--color-neutral-900)]">
                  {stats.users.permanent}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
                <p className="text-xs text-[var(--color-neutral-600)] mb-1">総ショット数</p>
                <p className="text-2xl font-bold text-[var(--color-neutral-900)]">
                  {stats.shots.total}
                </p>
                <p className="text-xs text-[var(--color-neutral-500)] mt-1">
                  平均: {stats.shots.averagePerUser}ショット/人
                </p>
              </div>
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4">
                <p className="text-xs text-[var(--color-neutral-600)] mb-1">総売上</p>
                <p className="text-2xl font-bold text-[var(--color-neutral-900)]">
                  ¥{stats.payments.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--color-neutral-500)] mt-1">
                  {stats.payments.total}件
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 管理メニュー */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
            管理メニュー
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-justify">
            <AdminMenuCard
              title="使用状況分析"
              icon={<Icon category="ui" name="analysis" size={24} />}
              description="ユーザーの使用状況、ショットデータ、収益レポートなどを確認できます"
              onClick={() => router.push('/admin/analytics')}
              disabled={true}
            />

            <AdminMenuCard
              title="ユーザー管理"
              icon={<Icon category="ui" name="user" size={24} />}
              description="ユーザー一覧の確認、永久利用権の付与、ユーザー情報の編集ができます"
              onClick={() => router.push('/admin/users')}
            />

            <AdminMenuCard
              title="サブスクリプション管理"
              icon={<Icon category="ui" name="calendar" size={24} />}
              description="全ユーザーのサブスクリプション状況、Stripe連携情報を管理できます"
              onClick={() => router.push('/admin/subscriptions')}
            />

            <AdminMenuCard
              title="解約申請管理"
              icon={<Icon category="ui" name="delete" size={24} />}
              description="ユーザーからの解約申請の確認と処理を行います"
              onClick={() => router.push('/admin/cancellation-requests')}
              badge={systemInfo?.pendingRequests ? String(systemInfo.pendingRequests) : undefined}
            />

            <AdminMenuCard
              title="メール配信管理"
              icon={<Icon category="ui" name="edit" size={24} />}
              description="お知らせメールやキャンペーンメールの配信管理を行います"
              onClick={() => router.push('/admin/emails')}
            />

            <AdminMenuCard
              title="システム設定"
              icon={<Icon category="ui" name="settings" size={24} />}
              description="アプリケーション全体の設定、環境変数、機能フラグなどを管理します"
              onClick={() => router.push('/admin/settings')}
              disabled={true}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
