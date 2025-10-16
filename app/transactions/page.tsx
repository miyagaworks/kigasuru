import React from 'react';
import Link from 'next/link';

/**
 * 特定商取引法に基づく表記ページ
 */
export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/landing"
            className="text-[var(--color-primary-green)] hover:text-[var(--color-primary-dark)] font-bold text-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            トップページに戻る
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-neutral-900)] mb-8 pb-4 border-b-4 border-[var(--color-primary-green)]">
            特定商取引法に基づく表記
          </h1>

          <div className="space-y-8">
            {/* 販売事業者 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                販売事業者
              </h2>
              <p className="text-[var(--color-neutral-700)] leading-relaxed pl-4">
                株式会社Senrigan
              </p>
            </section>

            {/* 運営責任者 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                運営責任者
              </h2>
              <p className="text-[var(--color-neutral-700)] leading-relaxed pl-4">
                宮川 清実
              </p>
            </section>

            {/* 所在地 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                所在地
              </h2>
              <p className="text-[var(--color-neutral-700)] leading-relaxed pl-4">
                〒731-0137 広島県広島市安佐南区山本2-3-35
              </p>
            </section>

            {/* 電話番号 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                電話番号
              </h2>
              <p className="text-[var(--color-neutral-700)] leading-relaxed pl-4">
                082-209-0181（平日10:00-18:00 土日祝日を除く）
              </p>
            </section>

            {/* メールアドレス */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                メールアドレス
              </h2>
              <p className="text-[var(--color-neutral-700)] leading-relaxed pl-4">
                <a
                  href="mailto:info@sns-share.com"
                  className="text-[var(--color-secondary-blue)] hover:underline"
                >
                  info@sns-share.com
                </a>
              </p>
            </section>

            {/* サービス名 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                サービス名
              </h2>
              <p className="text-[var(--color-neutral-700)] leading-relaxed pl-4">
                上手くなる気がするぅぅぅ
              </p>
            </section>

            {/* 料金 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                料金
              </h2>
              <div className="text-[var(--color-neutral-700)] leading-relaxed pl-4 space-y-2">
                <p>・月額プラン: 550円/月（税込）</p>
                <p>・年額プラン: 5,500円/年（税込）</p>
              </div>
            </section>

            {/* 支払い方法 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                支払い方法
              </h2>
              <p className="text-[var(--color-neutral-700)] leading-relaxed pl-4">
                クレジットカード決済（VISA、MasterCard、JCB、American
                Express、Diners Club）
              </p>
            </section>

            {/* 支払い時期 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                支払い時期
              </h2>
              <div className="text-[var(--color-neutral-700)] leading-relaxed pl-4 space-y-2">
                <p>・月額プラン: お申し込み時および更新時に1ヶ月分の料金をお支払いいただきます</p>
                <p>・年額プラン: お申し込み時および更新時に1年分の料金をお支払いいただきます</p>
              </div>
            </section>

            {/* サービスの提供時期 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                サービスの提供時期
              </h2>
              <p className="text-[var(--color-neutral-700)] leading-relaxed pl-4">
                お申し込み完了後、即座にご利用いただけます
              </p>
            </section>

            {/* 返品・キャンセルについて */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                返品・キャンセルについて
              </h2>
              <p className="text-[var(--color-neutral-700)] leading-relaxed pl-4">
                デジタルコンテンツの性質上、原則として返品・キャンセルには応じられません。ただし、法律の規定に基づく場合はこの限りではありません。
              </p>
            </section>

            {/* 解約方法 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary-green)] rounded"></span>
                解約方法
              </h2>
              <p className="text-[var(--color-neutral-700)] leading-relaxed pl-4">
                アカウント設定画面から解約可能です。解約後は、契約期間満了時点でサービスのご利用が終了します。
              </p>
            </section>
          </div>

          {/* 更新日 */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-[var(--color-neutral-600)] text-right">
              最終更新日: 2025年10月16日
            </p>
          </div>
        </div>

        {/* フッターリンク */}
        <div className="mt-8 text-center">
          <Link
            href="/landing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary-green)] text-white font-bold rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors shadow-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            トップページに戻る
          </Link>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--color-neutral-600)]">
            <Link href="/privacy" className="hover:text-[var(--color-primary-green)] transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-[var(--color-primary-green)] transition-colors">
              利用規約
            </Link>
            <Link href="/transactions" className="hover:text-[var(--color-primary-green)] transition-colors font-bold">
              特定商取引法に基づく表記
            </Link>
          </div>
          <p className="text-center text-sm text-[var(--color-neutral-500)] mt-6">
            &copy; 2025 Senrigan Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
