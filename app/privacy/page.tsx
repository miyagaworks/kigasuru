'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
          プライバシーポリシー
        </h1>

        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <p className="text-gray-600 mb-8 text-justify">
            上手くなる気がするぅぅぅ（以下「本サービス」）は、ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
          </p>

          {/* 第1条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第1条（個人情報の定義）
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              本ポリシーにおいて「個人情報」とは、個人情報保護法第2条第1項により定義された個人情報、すなわち、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日その他の記述等により特定の個人を識別できるもの（他の情報と容易に照合することができ、それにより特定の個人を識別することができることとなるものを含みます）、または個人識別符号が含まれる情報を指します。
            </p>
          </section>

          {/* 第2条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第2条（個人情報の収集方法）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本サービスは、ユーザーが利用登録する際に、以下の個人情報を収集することがあります。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>氏名</li>
              <li>メールアドレス</li>
              <li>プロフィール画像</li>
              <li>その他、本サービスの提供に必要な情報</li>
            </ul>
          </section>

          {/* 第3条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第3条（個人情報を収集・利用する目的）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本サービスが個人情報を収集・利用する目的は、以下のとおりです。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに対応するため</li>
              <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等の案内をするため</li>
              <li>メンテナンス、重要なお知らせなど必要に応じた連絡をするため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
              <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
              <li>上記の利用目的に付随する目的</li>
            </ul>
          </section>

          {/* 第4条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第4条（利用目的の変更）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本サービスは、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              利用目的の変更を行った場合には、変更後の目的について、本サービス所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。
            </p>
          </section>

          {/* 第5条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第5条（個人情報の第三者提供）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
            </ul>
          </section>

          {/* 第6条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第6条（個人情報の開示）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本サービスは、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
              <li>本サービスの業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
              <li>その他法令に違反することとなる場合</li>
            </ul>
          </section>

          {/* 第7条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第7条（個人情報の訂正および削除）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              ユーザーは、本サービスの保有する自己の個人情報が誤った情報である場合には、本サービスが定める手続きにより、本サービスに対して個人情報の訂正、追加または削除（以下「訂正等」といいます）を請求することができます。
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              本サービスは、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。
            </p>
          </section>

          {/* 第8条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第8条（個人情報の利用停止等）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本サービスは、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます）を求められた場合には、遅滞なく必要な調査を行います。
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              前項の調査結果に基づき、その請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。
            </p>
          </section>

          {/* 第9条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第9条（Cookieおよびその他の技術の利用）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本サービスは、Cookieおよびこれに類する技術を利用することがあります。これらの技術は、本サービスによる本サービスの利用状況等の把握に役立ち、サービス向上に資するものです。
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              Cookieを無効化されたいユーザーは、ウェブブラウザの設定を変更することによりCookieを無効化することができます。ただし、Cookieを無効化すると、本サービスの一部の機能をご利用いただけなくなる場合があります。
            </p>
          </section>

          {/* 第10条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第10条（プライバシーポリシーの変更）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              本サービスが別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
            </p>
          </section>

          {/* 第11条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第11条（お問い合わせ窓口）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700">
                <Link href="/#contact" className="text-[var(--color-primary-green)] hover:underline font-semibold">
                  お問い合わせフォーム
                </Link>
                からお問い合わせください
              </p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              制定日: 2025年10月1日
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
            <Link href="/privacy" className="hover:text-white transition-colors font-semibold">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              利用規約
            </Link>
            <Link href="/transactions" className="hover:text-white transition-colors">
              特定商取引法に基づく表記
            </Link>
          </div>

          <p className="text-gray-500 text-sm mt-6">
            &copy; 2025 Senrigan Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
