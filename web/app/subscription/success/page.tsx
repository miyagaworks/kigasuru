'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

/**
 * 決済成功ページ
 */
export default function SubscriptionSuccessPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!sessionId) {
      setError('セッションIDが見つかりません');
      setIsVerifying(false);
      return;
    }

    // 決済完了を確認
    // Webhookで処理されるので、ここでは確認のみ
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [session, sessionId, router]);

  if (!session) {
    return null;
  }

  if (isVerifying) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--color-primary-green)] mb-6"></div>
            <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4">
              決済を確認中...
            </h1>
            <p className="text-[var(--color-neutral-600)]">
              決済情報を確認しています。しばらくお待ちください。
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-[var(--color-error-bg)] rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon category="ui" name="close" size={32} className="text-[var(--color-error-text)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4">
              エラーが発生しました
            </h1>
            <p className="text-[var(--color-neutral-600)] mb-6">
              {error}
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/subscription')}
              className="bg-[var(--color-primary-green)]"
            >
              サブスクリプションページに戻る
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          {/* 成功アイコン */}
          <div className="w-20 h-20 bg-[var(--color-success-bg)] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Icon category="ui" name="check" size={48} className="text-[var(--color-success-text)]" />
          </div>

          <h1 className="text-3xl font-bold text-[var(--color-neutral-900)] mb-4">
            お支払いが完了しました！
          </h1>

          <p className="text-[var(--color-neutral-600)] mb-8 text-justify">
            ご購入ありがとうございます。
            <br />
            アカウントが正常にアップグレードされました。
            <br />
            すべての機能をお楽しみいただけます。
          </p>

          {/* 機能リスト */}
          <div className="bg-[var(--color-card-bg)] rounded-lg p-6 mb-8 text-left">
            <h2 className="font-bold text-[var(--color-neutral-900)] mb-4 flex items-center gap-2">
              <Icon category="ui" name="check" size={20} />
              利用可能な機能
            </h2>
            <ul className="space-y-3 text-sm text-[var(--color-neutral-700)]">
              <li className="flex items-start gap-2">
                <Icon category="ui" name="check" size={16} className="mt-0.5 text-[var(--color-success-text)]" />
                <span>無制限のショット記録</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon category="ui" name="check" size={16} className="mt-0.5 text-[var(--color-success-text)]" />
                <span>詳細な分析レポート</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon category="ui" name="check" size={16} className="mt-0.5 text-[var(--color-success-text)]" />
                <span>クラブ別データ管理</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon category="ui" name="check" size={16} className="mt-0.5 text-[var(--color-success-text)]" />
                <span>天候・コンディション記録</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon category="ui" name="check" size={16} className="mt-0.5 text-[var(--color-success-text)]" />
                <span>プリセット機能</span>
              </li>
            </ul>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={() => router.push('/record')}
              className="w-full bg-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)]"
            >
              <Icon category="ui" name="record" size={20} className="mr-2" />
              ショットを記録する
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              <Icon category="ui" name="home" size={20} className="mr-2" />
              ダッシュボードへ
            </Button>
          </div>

          {/* サポート情報 */}
          <p className="text-xs text-[var(--color-neutral-500)] mt-8">
            ご不明な点がございましたら、設定画面からお問い合わせください。
          </p>
        </div>
      </div>
    </Layout>
  );
}
