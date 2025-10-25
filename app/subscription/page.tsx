'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

/**
 * サブスクリプションデータの型定義
 */
interface SubscriptionData {
  subscription: {
    id: string;
    plan: string;
    status: string;
    startDate: string;
    endDate: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    canceledAt: string | null;
    serviceEndDate: string | null;
    interval?: string;
    cancelAtPeriodEnd?: boolean;
  } | null;
  user: {
    subscriptionStatus: string;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    trialDaysRemaining: number;
    isPermanentUser: boolean;
  };
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    plan: string | null;
    createdAt: string;
  }>;
  cancellationRequest: {
    id: string;
    status: string;
    createdAt: string;
  } | null;
}

/**
 * サブスクリプション管理ページ
 */
export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // セッションのロード中は何もしない
    if (status === 'loading') {
      return;
    }

    // セッションがない場合のみリダイレクト
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch('/api/subscription');
        if (!response.ok) {
          throw new Error('サブスクリプション情報の取得に失敗しました');
        }
        const data = await response.json();
        setSubscriptionData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [session, router, status]);

  const handleCheckout = async (priceType: string) => {
    setIsCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });

      if (!response.ok) {
        throw new Error('チェックアウトセッションの作成に失敗しました');
      }

      const data = await response.json();

      // Stripeのチェックアウトページにリダイレクト
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      setIsCheckoutLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/subscription/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '解約申請に失敗しました');
      }

      setShowCancelDialog(false);
      setCancelReason('');
      alert('解約申請を受け付けました。管理者が確認後、処理いたします。');

      // データを再取得して表示を更新
      const refreshResponse = await fetch('/api/subscription');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setSubscriptionData(refreshData);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsCancelling(false);
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

  if (error) {
    return (
      <Layout showNav={true}>
        <div className="p-6">
          <div className="bg-[var(--color-error-bg)] border-l-4 border-[var(--color-error-text)] p-4 rounded">
            <p className="text-[var(--color-error-text)]">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const { user, subscription, payments, cancellationRequest } = subscriptionData;

  // トライアル状態の判定
  const isTrialActive = user.subscriptionStatus === 'trial' && user.trialDaysRemaining > 0;
  const isPermanentUser = user.isPermanentUser;

  // 猶予期間の計算
  let isInGracePeriod = false;
  let graceDaysRemaining = 0;
  if (user.trialEndsAt && user.subscriptionStatus === 'trial' && user.trialDaysRemaining <= 0) {
    const trialEnd = new Date(user.trialEndsAt);
    const gracePeriodEnd = new Date(trialEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
    const now = new Date();
    if (now < gracePeriodEnd) {
      isInGracePeriod = true;
      graceDaysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  return (
    <Layout showNav={true}>
      <div className="p-4">
        {/* スペーサー */}
        <div className="h-4"></div>

        {/* ヘッダー */}
        <h1 className="text-xl font-bold text-[var(--color-neutral-900)] mb-4 flex items-center gap-2">
          <Icon category="ui" name="settings" size={24} />
          ご利用プラン
        </h1>

        {/* トライアルバナー */}
        {isTrialActive && (
          <div className="mb-4 bg-[var(--color-info-bg)] border-l-4 border-[var(--color-info-border)] p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon
                category="ui"
                name="info"
                size={20}
                className="text-[var(--color-info-text)] flex-shrink-0 mt-0.5"
              />
              <div>
                <h3 className="text-base font-bold text-[var(--color-info-text)]">
                  トライアル期間中
                </h3>
                <p className="text-sm text-[var(--color-info-text)] mt-1">
                  あと<strong>{user.trialDaysRemaining}日間</strong>
                  無料でご利用いただけます
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 猶予期間警告 */}
        {isInGracePeriod && (
          <div className="mb-4 bg-[var(--color-error-bg)] border-l-4 border-[var(--color-error-text)] p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-[var(--color-error-text)] flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-base font-bold text-[var(--color-error-text)]">
                  猶予期間中
                </h3>
                <p className="text-sm text-[var(--color-error-text)] mt-1">
                  トライアル期間が終了しました。あと
                  <strong>{graceDaysRemaining}日間</strong>
                  の猶予期間があります。
                  <br />
                  お支払い手続きをされない場合、データが削除される可能性があります。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* サブスクリプション状態 */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 mb-4 border-l-4 border-[var(--color-primary-green)]">
          <h2 className="text-base font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[var(--color-primary-green)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            現在のプラン
          </h2>

          {isPermanentUser ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-primary-green)] text-white mb-3">
                <svg
                  className="w-7 h-7"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--color-primary-green)] mb-1">
                永久利用権
              </h3>
              <p className="text-sm text-[var(--color-neutral-700)]">
                無期限でご利用いただけます
              </p>
            </div>
          ) : subscription ? (
            <div>
              {/* プラン情報カード */}
              <div className="bg-[var(--color-neutral-100)] rounded-lg p-3 mb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                      プラン
                    </p>
                    <p className="text-base font-bold text-[var(--color-neutral-900)]">
                      {subscription.plan === "monthly"
                        ? "月額プラン"
                        : subscription.plan === "yearly"
                          ? "年額プラン"
                          : subscription.plan}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                      状態
                    </p>
                    {cancellationRequest ? (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]">
                        解約申請中
                      </span>
                    ) : (
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                          subscription.status === "active"
                            ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                            : "bg-[var(--color-neutral-300)] text-[var(--color-neutral-700)]"
                        }`}
                      >
                        {subscription.status === "active"
                          ? "アクティブ"
                          : subscription.status === "canceled"
                            ? "キャンセル済み"
                            : subscription.status}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                      開始日
                    </p>
                    <p className="text-sm font-bold text-[var(--color-neutral-900)]">
                      {new Date(subscription.startDate).toLocaleDateString(
                        "ja-JP"
                      )}
                    </p>
                  </div>
                  {subscription.status === "canceled" && subscription.serviceEndDate ? (
                    <>
                      <div>
                        <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                          サービス利用終了日
                        </p>
                        <p className="text-sm font-bold text-[var(--color-error-text)]">
                          {new Date(subscription.serviceEndDate).toLocaleDateString(
                            "ja-JP"
                          )}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                          利用停止日
                        </p>
                        <p className="text-sm font-bold text-[var(--color-error-text)]">
                          {new Date(
                            new Date(subscription.serviceEndDate).getTime() +
                              24 * 60 * 60 * 1000
                          ).toLocaleDateString("ja-JP")}
                        </p>
                        <p className="text-xs text-[var(--color-neutral-600)] mt-1">
                          上記日付からご利用不可となります
                        </p>
                      </div>
                    </>
                  ) : (
                    subscription.endDate && (
                      <div>
                        <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                          次回更新日
                        </p>
                        <p className="text-sm font-bold text-[var(--color-primary-green)]">
                          {new Date(subscription.endDate).toLocaleDateString(
                            "ja-JP"
                          )}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 解約申請リンク */}
              {subscription.status === "active" &&
                !subscription.cancelAtPeriodEnd &&
                !cancellationRequest && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-neutral-300)] text-center">
                    <button
                      onClick={() => setShowCancelDialog(true)}
                      className="text-xs text-[var(--color-neutral-500)] hover:text-[var(--color-error-text)] underline transition-colors"
                    >
                      サブスクリプションを解約する
                    </button>
                  </div>
                )}

              {/* 解約申請中の通知 */}
              {cancellationRequest && (
                <div className="mt-4 pt-4 border-t border-[var(--color-neutral-300)]">
                  <div className="bg-[var(--color-warning-bg)] border-l-4 border-[var(--color-warning-border)] p-3 rounded">
                    <div className="flex items-start gap-2">
                      <Icon
                        category="ui"
                        name="info"
                        size={18}
                        className="text-[var(--color-warning-text)] flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-bold text-[var(--color-warning-text)] mb-1">
                          解約申請を受付中
                        </p>
                        <p className="text-xs text-[var(--color-warning-text)]">
                          管理者が確認後、処理いたします。承認されるまでお待ちください。
                        </p>
                        <p className="text-xs text-[var(--color-neutral-600)] mt-2">
                          申請日: {new Date(cancellationRequest.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <svg
                className="w-12 h-12 text-[var(--color-neutral-400)] mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-sm text-[var(--color-neutral-700)] mb-3">
                アクティブなサブスクリプションがありません
              </p>
              <Button
                variant="primary"
                onClick={() => setShowPlanSelection(true)}
                className="bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)]"
              >
                プランを選択
              </Button>
            </div>
          )}
        </div>

        {/* 支払い履歴 */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 border-l-4 border-[var(--color-secondary-blue)]">
          <h2 className="text-base font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[var(--color-secondary-blue)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            支払い履歴
          </h2>

          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center p-3 bg-[var(--color-neutral-100)] rounded-lg"
                >
                  <div>
                    <p className="text-base font-bold text-[var(--color-neutral-900)]">
                      ¥{payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--color-neutral-600)]">
                      {new Date(payment.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                    {payment.plan && (
                      <p className="text-xs text-[var(--color-neutral-600)] mt-0.5">
                        {payment.plan === "monthly"
                          ? "月額プラン"
                          : payment.plan === "yearly"
                            ? "年額プラン"
                            : payment.plan}
                      </p>
                    )}
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        payment.status === "succeeded"
                          ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                          : payment.status === "pending"
                            ? "bg-[var(--color-info-bg)] text-[var(--color-info-text)]"
                            : "bg-[var(--color-error-bg)] text-[var(--color-error-text)]"
                      }`}
                    >
                      {payment.status === "succeeded"
                        ? "成功"
                        : payment.status === "pending"
                          ? "処理中"
                          : payment.status === "failed"
                            ? "失敗"
                            : payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--color-neutral-700)] py-6">
              支払い履歴はありません
            </p>
          )}
        </div>

        {/* スペーサー */}
        <div className="h-4"></div>

        {/* プラン選択モーダル */}
        {showPlanSelection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* モーダルヘッダー */}
              <div className="sticky top-0 bg-white border-b border-[var(--color-neutral-200)] p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-neutral-900)]">
                  プランを選択
                </h2>
                <button
                  onClick={() => setShowPlanSelection(false)}
                  className="p-2 hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors"
                >
                  <Icon category="ui" name="close" size={20} />
                </button>
              </div>

              {/* プラン一覧 */}
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* 年額プラン（おすすめ） */}
                  <div className="border-2 border-[var(--color-primary-green)] rounded-xl p-4 relative bg-gradient-to-br from-green-50 to-white">
                    <div className="absolute -top-2 right-4 bg-[var(--color-primary-green)] text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      おすすめ
                    </div>
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-1">
                        年額プラン
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-[var(--color-primary-green)]">
                          ¥5,500
                        </span>
                        <span className="text-sm text-[var(--color-neutral-600)]">
                          /年（税込）
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-neutral-600)] mt-1">
                        月額換算: ¥458/月 - 16%お得
                      </p>
                    </div>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-start gap-2">
                        <Icon
                          category="ui"
                          name="check"
                          size={18}
                          className="text-[var(--color-success-text)] mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-[var(--color-neutral-700)]">
                          無制限のショット記録
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon
                          category="ui"
                          name="check"
                          size={18}
                          className="text-[var(--color-success-text)] mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-[var(--color-neutral-700)]">
                          詳細な分析レポート
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon
                          category="ui"
                          name="check"
                          size={18}
                          className="text-[var(--color-success-text)] mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-[var(--color-neutral-700)]">
                          クラブ別データ管理
                        </span>
                      </li>
                    </ul>
                    <Button
                      variant="primary"
                      onClick={() => handleCheckout("yearly")}
                      disabled={isCheckoutLoading}
                      className="w-full bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)]"
                    >
                      {isCheckoutLoading ? "処理中..." : "年額プランを選択"}
                    </Button>
                  </div>

                  {/* 月額プラン */}
                  <div className="border-2 border-[var(--color-neutral-300)] rounded-xl p-4 hover:border-[var(--color-primary-green)] transition-colors">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-1">
                        月額プラン
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-[var(--color-primary-green)]">
                          ¥550
                        </span>
                        <span className="text-sm text-[var(--color-neutral-600)]">
                          /月（税込）
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-start gap-2">
                        <Icon
                          category="ui"
                          name="check"
                          size={18}
                          className="text-[var(--color-success-text)] mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-[var(--color-neutral-700)]">
                          無制限のショット記録
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon
                          category="ui"
                          name="check"
                          size={18}
                          className="text-[var(--color-success-text)] mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-[var(--color-neutral-700)]">
                          詳細な分析レポート
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon
                          category="ui"
                          name="check"
                          size={18}
                          className="text-[var(--color-success-text)] mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-[var(--color-neutral-700)]">
                          クラブ別データ管理
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon
                          category="ui"
                          name="check"
                          size={18}
                          className="text-[var(--color-success-text)] mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-[var(--color-neutral-700)]">
                          いつでも解約可能
                        </span>
                      </li>
                    </ul>
                    <Button
                      variant="primary"
                      onClick={() => handleCheckout("monthly")}
                      disabled={isCheckoutLoading}
                      className="w-full bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)]"
                    >
                      {isCheckoutLoading ? "処理中..." : "月額プランを選択"}
                    </Button>
                  </div>
                </div>

                {/* 注意事項 */}
                <div className="mt-4 p-3 bg-[var(--color-info-bg)] rounded-lg">
                  <p className="text-xs text-[var(--color-info-text)] flex items-start gap-2">
                    <Icon
                      category="ui"
                      name="info"
                      size={16}
                      className="flex-shrink-0 mt-0.5"
                    />
                    <span>
                      決済はStripeを通じて安全に処理されます。サブスクリプションはいつでも解約できます。
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 解約申請ダイアログ */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              {/* ヘッダー */}
              <div className="border-b border-[var(--color-neutral-200)] p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--color-neutral-900)]">
                  解約申請
                </h2>
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelReason("");
                  }}
                  className="p-2 hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors"
                  disabled={isCancelling}
                >
                  <Icon category="ui" name="close" size={24} />
                </button>
              </div>

              {/* コンテンツ */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-[var(--color-neutral-700)] mb-2">
                    サブスクリプションの解約を申請します。解約申請後、管理者が確認して処理を行います。
                  </p>
                  <div className="bg-[var(--color-info-bg)] border-l-4 border-[var(--color-info-border)] p-3 rounded">
                    <p className="text-xs text-[var(--color-info-text)]">
                      <Icon
                        category="ui"
                        name="info"
                        size={14}
                        className="inline mr-1"
                      />
                      解約が承認されると、サブスクリプションが終了します
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                    解約理由（任意）
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="解約される理由をお聞かせください"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-[var(--color-neutral-300)] rounded-lg focus:border-[var(--color-primary-green)] focus:outline-none resize-none"
                    disabled={isCancelling}
                  />
                </div>

                {/* アクションボタン */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCancelDialog(false);
                      setCancelReason("");
                    }}
                    disabled={isCancelling}
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCancelRequest}
                    disabled={isCancelling}
                    className="flex-1 bg-[var(--color-secondary-red)] hover:bg-red-900 text-white"
                  >
                    {isCancelling ? "処理中..." : "解約を申請"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
