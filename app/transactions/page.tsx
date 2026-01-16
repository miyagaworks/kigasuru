'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * 特定商取引法に基づく表記ページ
 */
export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--color-primary-green)] hover:text-[var(--color-primary-dark)] transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span>トップページに戻る</span>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          特定商取引法に基づく表記
        </h1>

        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          {/* 販売事業者 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              販売事業者
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              株式会社Senrigan
            </p>
          </section>

          {/* 運営責任者 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              運営責任者
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              宮川 清実
            </p>
          </section>

          {/* 所在地 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              所在地
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              〒731-0137 広島県広島市安佐南区山本2-3-35
            </p>
          </section>

          {/* 電話番号 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              電話番号
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              082-209-0181（平日10:00-18:00 土日祝日を除く）
            </p>
          </section>

          {/* メールアドレス */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              メールアドレス
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              support [at] kigasuru [dot] com
            </p>
            <p className="text-gray-500 text-sm mt-2 text-justify">
              ※ スパム対策のため、[at]を@に、[dot]を.に置き換えてご連絡ください
            </p>
          </section>

          {/* サービス名 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              サービス名
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              上手くなる気がするぅぅぅ
            </p>
          </section>

          {/* 料金 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              料金
            </h2>
            <div className="text-gray-700 leading-relaxed text-justify space-y-2">
              <p>月額プラン: 550円/月（税込）</p>
              <p>年額プラン: 5,500円/年（税込）</p>
            </div>
          </section>

          {/* 支払い方法 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              支払い方法
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              クレジットカード決済（VISA、MasterCard、JCB、American Express、Diners Club）
            </p>
          </section>

          {/* 支払い時期 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              支払い時期
            </h2>
            <div className="text-gray-700 leading-relaxed text-justify space-y-2">
              <p>月額プラン: お申し込み時および更新時に1ヶ月分の料金をお支払いいただきます。</p>
              <p>年額プラン: お申し込み時および更新時に1年分の料金をお支払いいただきます。</p>
            </div>
          </section>

          {/* サービスの提供時期 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              サービスの提供時期
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              お申し込み完了後、即座にご利用いただけます。
            </p>
          </section>

          {/* 返品・キャンセルについて */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              返品・キャンセルについて
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              デジタルコンテンツの性質上、原則として返品・キャンセルには応じられません。ただし、法律の規定に基づく場合はこの限りではありません。
            </p>
          </section>

          {/* 解約方法 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              解約方法
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              アカウント設定画面から解約可能です。解約後は、契約期間満了時点でサービスのご利用が終了します。
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              最終更新日: 2025年10月16日
            </p>
          </div>
        </div>

        {/* CTAセクション */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[var(--color-primary-green)] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[var(--color-primary-dark)] transition-colors shadow-lg"
          >
            <ArrowLeft size={20} />
            トップページに戻る
          </Link>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12 mt-20 border-t-4 border-[var(--color-primary-green)]">
        <div className="container mx-auto px-4 text-center">
          <Link
            href="/"
            className="text-[var(--color-primary-green)] hover:text-green-400 font-bold text-xl transition-colors"
          >
            上手くなる気がするぅぅぅ
          </Link>
          <p className="text-gray-400 mt-3">データで変わる、あなたのゴルフ</p>

          <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              利用規約
            </Link>
            <Link href="/transactions" className="hover:text-white transition-colors font-semibold">
              特定商取引法に基づく表記
            </Link>
          </div>

          <p className="text-gray-500 text-sm mt-6">
            &copy; {new Date().getFullYear()} Senrigan Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
