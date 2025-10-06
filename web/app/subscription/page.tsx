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
}

/**
 * サブスクリプション管理ページ
 */
export default function SubscriptionPage() {
  const { data: session } = useSession();
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
    if (!session) {
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
  }, [session, router]);

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

  const { user, subscription, payments } = subscriptionData;

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
      <div className="p-6">
        {/* ヘッダー */}
        <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-6 flex items-center gap-2">
          <Icon category="ui" name="settings" size={28} />
          ご利用プラン
        </h1>

        {/* トライアルバナー */}
        {isTrialActive && (
          <div className="mb-6 bg-[var(--color-info-bg)] border-l-4 border-[var(--color-info-border)] p-4 rounded-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-[var(--color-info-text)] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-info-text)]">トライアル期間中</h3>
                <p className="text-sm text-[var(--color-info-text)] mt-1">
                  あと<strong>{user.trialDaysRemaining}日間</strong>無料でご利用いただけます
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 猶予期間警告 */}
        {isInGracePeriod && (
          <div className="mb-6 bg-[var(--color-error-bg)] border-l-4 border-[var(--color-error-text)] p-4 rounded-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-[var(--color-error-text)] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-error-text)]">猶予期間中</h3>
                <p className="text-sm text-[var(--color-error-text)] mt-1">
                  トライアル期間が終了しました。あと<strong>{graceDaysRemaining}日間</strong>の猶予期間があります。
                  <br />
                  お支払い手続きをされない場合、データが削除される可能性があります。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* サブスクリプション状態 */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">現在のプラン</h2>

          {isPermanentUser ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-primary-green)] text-white mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-primary-green)] mb-2">永久利用権</h3>
              <p className="text-[var(--color-neutral-700)]">無期限でご利用いただけます</p>
            </div>
          ) : subscription ? (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--color-neutral-600)]">プラン</p>
                  <p className="text-lg font-bold text-[var(--color-neutral-900)]">
                    {subscription.plan === 'monthly' ? '月額プラン' :
                     subscription.plan === 'yearly' ? '年額プラン' :
                     subscription.plan}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-neutral-600)]">状態</p>
                  <p className="text-lg font-bold text-[var(--color-neutral-900)]">
                    {subscription.status === 'active' ? 'アクティブ' :
                     subscription.status === 'canceled' ? 'キャンセル済み' :
                     subscription.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-neutral-600)]">開始日</p>
                  <p className="text-lg font-bold text-[var(--color-neutral-900)]">
                    {new Date(subscription.startDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                {subscription.endDate && (
                  <div>
                    <p className="text-sm text-[var(--color-neutral-600)]">次回更新日</p>
                    <p className="text-lg font-bold text-[var(--color-neutral-900)]">
                      {new Date(subscription.endDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                )}
              </div>

              {/* 解約申請ボタン */}
              {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                <div className="mt-6 pt-6 border-t border-[var(--color-neutral-300)]">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full border-[var(--color-error-text)] text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)]"
                  >
                    解約を申請する
                  </Button>
                  <p className="text-xs text-[var(--color-neutral-600)] text-center mt-2">
                    解約申請後、管理者が確認いたします
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--color-neutral-700)] mb-4">
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
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">支払い履歴</h2>

          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center p-4 bg-[var(--color-neutral-100)] rounded-lg"
                >
                  <div>
                    <p className="font-bold text-[var(--color-neutral-900)]">
                      ¥{payment.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-[var(--color-neutral-600)]">
                      {new Date(payment.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                    {payment.plan && (
                      <p className="text-xs text-[var(--color-neutral-600)] mt-1">
                        {payment.plan}
                      </p>
                    )}
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        payment.status === 'succeeded'
                          ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
                          : payment.status === 'pending'
                          ? 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]'
                          : 'bg-[var(--color-error-bg)] text-[var(--color-error-text)]'
                      }`}
                    >
                      {payment.status === 'succeeded' ? '成功' :
                       payment.status === 'pending' ? '処理中' :
                       payment.status === 'failed' ? '失敗' :
                       payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--color-neutral-700)] py-8">
              支払い履歴はありません
            </p>
          )}
        </div>

        {/* プラン選択モーダル */}
        {showPlanSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* モーダルヘッダー */}
              <div className="sticky top-0 bg-white border-b border-[var(--color-neutral-200)] p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--color-neutral-900)]">プランを選択</h2>
                <button
                  onClick={() => setShowPlanSelection(false)}
                  className="p-2 hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors"
                >
                  <Icon category="ui" name="close" size={24} />
                </button>
              </div>

              {/* プラン一覧 */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 月額プラン */}
                  <div className="border-2 border-[var(--color-neutral-300)] rounded-xl p-6 hover:border-[var(--color-primary-green)] transition-colors">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-[var(--color-neutral-900)] mb-2">月額プラン</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-[var(--color-primary-green)]">¥980</span>
                        <span className="text-[var(--color-neutral-600)]">/月</span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">無制限のショット記録</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">詳細な分析レポート</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">クラブ別データ管理</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">いつでも解約可能</span>
                      </li>
                    </ul>
                    <Button
                      variant="primary"
                      onClick={() => handleCheckout('monthly')}
                      disabled={isCheckoutLoading}
                      className="w-full bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)]"
                    >
                      {isCheckoutLoading ? '処理中...' : '月額プランを選択'}
                    </Button>
                  </div>

                  {/* 年額プラン */}
                  <div className="border-2 border-[var(--color-primary-green)] rounded-xl p-6 relative bg-gradient-to-br from-green-50 to-white">
                    <div className="absolute -top-3 right-4 bg-[var(--color-primary-green)] text-white px-3 py-1 rounded-full text-xs font-bold">
                      2ヶ月お得
                    </div>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-[var(--color-neutral-900)] mb-2">年額プラン</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-[var(--color-primary-green)]">¥9,800</span>
                        <span className="text-[var(--color-neutral-600)]">/年</span>
                      </div>
                      <p className="text-sm text-[var(--color-neutral-600)] mt-1">
                        (月額換算: ¥817/月)
                      </p>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">無制限のショット記録</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">詳細な分析レポート</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">クラブ別データ管理</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">年間で約2ヶ月分お得</span>
                      </li>
                    </ul>
                    <Button
                      variant="primary"
                      onClick={() => handleCheckout('yearly')}
                      disabled={isCheckoutLoading}
                      className="w-full bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)]"
                    >
                      {isCheckoutLoading ? '処理中...' : '年額プランを選択'}
                    </Button>
                  </div>

                  {/* 永久利用権 パーソナル */}
                  <div className="border-2 border-[var(--color-secondary-orange)] rounded-xl p-6 bg-gradient-to-br from-orange-50 to-white">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-[var(--color-neutral-900)] mb-2">永久利用権 パーソナル</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-[var(--color-secondary-orange)]">¥29,800</span>
                        <span className="text-[var(--color-neutral-600)]">買い切り</span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">永久に利用可能</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">全ての基本機能</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">追加費用なし</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">個人利用向け</span>
                      </li>
                    </ul>
                    <Button
                      variant="primary"
                      onClick={() => handleCheckout('permanent_personal')}
                      disabled={isCheckoutLoading}
                      className="w-full bg-[var(--color-secondary-orange)] hover:opacity-90"
                    >
                      {isCheckoutLoading ? '処理中...' : 'パーソナル版を購入'}
                    </Button>
                  </div>

                  {/* 永久利用権 プレミアム */}
                  <div className="border-2 border-[var(--color-secondary-blue)] rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-[var(--color-neutral-900)] mb-2">永久利用権 プレミアム</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-[var(--color-secondary-blue)]">¥49,800</span>
                        <span className="text-[var(--color-neutral-600)]">買い切り</span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">永久に利用可能</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">全ての基本機能</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">優先サポート</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon category="ui" name="check" size={20} className="text-[var(--color-success-text)] mt-0.5" />
                        <span className="text-sm text-[var(--color-neutral-700)]">将来の新機能も含む</span>
                      </li>
                    </ul>
                    <Button
                      variant="primary"
                      onClick={() => handleCheckout('permanent_premium')}
                      disabled={isCheckoutLoading}
                      className="w-full bg-[var(--color-secondary-blue)] hover:opacity-90"
                    >
                      {isCheckoutLoading ? '処理中...' : 'プレミアム版を購入'}
                    </Button>
                  </div>
                </div>

                {/* 注意事項 */}
                <div className="mt-6 p-4 bg-[var(--color-info-bg)] rounded-lg">
                  <p className="text-sm text-[var(--color-info-text)]">
                    <Icon category="ui" name="info" size={16} className="inline mr-2" />
                    決済はStripeを通じて安全に処理されます。サブスクリプションはいつでも解約できます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 解約申請ダイアログ */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              {/* ヘッダー */}
              <div className="border-b border-[var(--color-neutral-200)] p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--color-neutral-900)]">解約申請</h2>
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelReason('');
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
                      <Icon category="ui" name="info" size={14} className="inline mr-1" />
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
                      setCancelReason('');
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
                    className="flex-1 bg-[var(--color-error-text)] hover:opacity-90"
                  >
                    {isCancelling ? '処理中...' : '解約を申請'}
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
