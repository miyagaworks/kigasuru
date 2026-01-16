'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
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
          利用規約
        </h1>

        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <p className="text-gray-600 mb-8 text-justify">
            この利用規約（以下「本規約」といいます）は、上手くなる気がするぅぅぅ（以下「本サービス」といいます）の利用条件を定めるものです。ユーザーの皆さま（以下「ユーザー」といいます）には、本規約に従って、本サービスをご利用いただきます。
          </p>

          {/* 第1条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第1条（適用）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本規約は、ユーザーと本サービスの運営者（以下「運営者」といいます）との間の本サービスの利用に関わる一切の関係に適用されるものとします。
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              運営者は本サービスに関し、本規約のほか、ご利用にあたってのルール等、各種の定め（以下「個別規定」といいます）をすることがあります。これら個別規定はその名称のいかんに関わらず、本規約の一部を構成するものとします。
            </p>
          </section>

          {/* 第2条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第2条（利用登録）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本サービスにおいては、登録希望者が本規約に同意の上、運営者の定める方法によって利用登録を申請し、運営者がこれを承認することによって、利用登録が完了するものとします。
            </p>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              運営者は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
              <li>本規約に違反したことがある者からの申請である場合</li>
              <li>その他、運営者が利用登録を相当でないと判断した場合</li>
            </ul>
          </section>

          {/* 第3条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第3条（ユーザーIDおよびパスワードの管理）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。
            </p>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。運営者は、ユーザーIDとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのユーザーIDを登録しているユーザー自身による利用とみなします。
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              ユーザーID及びパスワードが第三者によって使用されたことによって生じた損害は、運営者に故意又は重大な過失がある場合を除き、運営者は一切の責任を負わないものとします。
            </p>
          </section>

          {/* 第4条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第4条（禁止事項）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
              <li>運営者、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>本サービスによって得られた情報を商業的に利用する行為</li>
              <li>運営者のサービスの運営を妨害するおそれのある行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正な目的を持って本サービスを利用する行為</li>
              <li>本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>運営者が許諾しない本サービス上での宣伝、広告、勧誘、または営業行為</li>
              <li>面識のない異性との出会いを目的とした行為</li>
              <li>運営者のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          {/* 第5条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第5条（本サービスの提供の停止等）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
              <li>コンピュータまたは通信回線等が事故により停止した場合</li>
              <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 text-justify">
              運営者は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
            </p>
          </section>

          {/* 第6条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第6条（利用制限および登録抹消）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              運営者は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>本規約のいずれかの条項に違反した場合</li>
              <li>登録事項に虚偽の事実があることが判明した場合</li>
              <li>料金等の支払債務の不履行があった場合</li>
              <li>運営者からの連絡に対し、一定期間返答がない場合</li>
              <li>本サービスについて、最終の利用から一定期間利用がない場合</li>
              <li>その他、運営者が本サービスの利用を適当でないと判断した場合</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 text-justify">
              運営者は、本条に基づき運営者が行った行為によりユーザーに生じた損害について、一切の責任を負いません。
            </p>
          </section>

          {/* 第7条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第7条（退会）
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              ユーザーは、運営者の定める退会手続により、本サービスから退会できるものとします。
            </p>
          </section>

          {/* 第7条の2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第7条の2（サブスクリプションの解約および返金）
            </h2>

            <h3 className="text-xl font-bold text-gray-800 mb-3 mt-6">1. 解約申請</h3>
            <p className="text-gray-700 leading-relaxed mb-2 text-justify">
              ユーザーは、本サービスの管理画面から、いつでもサブスクリプションの解約を申請することができます。解約申請後、運営者が内容を確認し、承認をもって解約が確定します。
            </p>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <strong>重要：</strong>解約処理には通常4〜5営業日かかります。次回更新日の直前（5日以内）に解約申請された場合、処理が間に合わず自動更新される可能性がございます。自動更新を確実に停止するには、次回更新日の少なくとも7日前までに解約申請を行ってください。
            </p>

            <h3 className="text-xl font-bold text-gray-800 mb-3 mt-6">2. 月額プランの解約</h3>
            <p className="text-gray-700 leading-relaxed mb-2 text-justify">
              月額プラン（550円/月・税込）を解約する場合：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>解約確定後も、次回更新日までは本サービスを引き続きご利用いただけます</li>
              <li>次回更新日の翌日から本サービスのご利用ができなくなります</li>
              <li>返金は行いません</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify bg-gray-50 p-4 rounded-lg">
              <strong>例：</strong>21日に契約した場合、次回更新日は翌月の21日となります。契約月中に解約申請し承認された場合でも、翌月の21日まではサービスをご利用いただけます。翌月の22日からサービスのご利用ができなくなります。
            </p>

            <h3 className="text-xl font-bold text-gray-800 mb-3 mt-6">3. 年額プランの解約</h3>
            <p className="text-gray-700 leading-relaxed mb-2 text-justify">
              年額プラン（5,500円/年・税込）を解約する場合：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>解約確定後、使用済み月数分（月額458円として計算）を差し引いた金額を返金いたします</li>
              <li>解約確定後も、サービス利用終了日までは本サービスを引き続きご利用いただけます</li>
              <li>サービス利用終了日は、契約日を基準日として、翌月または翌々月の基準日となります</li>
              <li>基準日の5日前までに解約申請された場合：翌月の基準日がサービス利用終了日</li>
              <li>基準日の4日前以降に解約申請された場合：翌々月の基準日がサービス利用終了日</li>
              <li>サービス利用終了日の翌日から本サービスのご利用ができなくなります</li>
              <li>返金はご登録のお支払い方法に対して行います（処理完了まで5〜10営業日程度かかる場合があります）</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify bg-gray-50 p-4 rounded-lg">
              <strong>返金計算例1：</strong>
              <br />
              ・9月1日に契約（5,500円支払い、次回更新日：翌年の9月1日、基準日：毎月1日）
              <br />
              ・10月25日に解約申請・承認（11月1日の5日前=10月27日より前なので、翌月の基準日が利用終了日）
              <br />
              ・使用期間：2ヶ月分（9月1日〜11月1日）= 916円
              <br />
              ・返金額：5,500円 - 916円 = 4,584円
              <br />
              ・サービス利用終了日：11月1日
              <br />
              ・サービス利用停止：11月2日から
              <br /><br />
              <strong>返金計算例2：</strong>
              <br />
              ・9月1日に契約（5,500円支払い、次回更新日：翌年の9月1日、基準日：毎月1日）
              <br />
              ・10月30日に解約申請・承認（11月1日の5日前=10月27日より後なので、翌々月の基準日が利用終了日）
              <br />
              ・使用期間：3ヶ月分（9月1日〜12月1日）= 1,374円
              <br />
              ・返金額：5,500円 - 1,374円 = 4,126円
              <br />
              ・サービス利用終了日：12月1日
              <br />
              ・サービス利用停止：12月2日から
            </p>

            <h3 className="text-xl font-bold text-gray-800 mb-3 mt-6">4. 解約の効力</h3>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              解約が確定した時点で、次回の自動更新は停止されます。ただし、上記の通り、お支払い済みの期間内は引き続き本サービスをご利用いただけます。
            </p>

            <h3 className="text-xl font-bold text-gray-800 mb-3 mt-6">5. データの取り扱い</h3>
            <p className="text-gray-700 leading-relaxed text-justify">
              サービス利用停止後、ユーザーのデータは一定期間保管されますが、その後削除される場合があります。データのバックアップが必要な場合は、サービス利用停止前にエクスポート機能をご利用ください。
            </p>
          </section>

          {/* 第8条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第8条（保証の否認および免責事項）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              運営者は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
            </p>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              運営者は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する運営者とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              前項ただし書に定める場合であっても、運営者は、運営者の過失（重過失を除きます。）による債務不履行または不法行為によりユーザーに生じた損害のうち特別な事情から生じた損害（運営者またはユーザーが損害発生につき予見し、または予見し得た場合を含みます。）について一切の責任を負いません。また、運営者の過失（重過失を除きます。）による債務不履行または不法行為によりユーザーに生じた損害の賠償は、ユーザーから当該損害が発生した月に受領した利用料の額を上限とします。
            </p>
          </section>

          {/* 第9条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第9条（サービス内容の変更等）
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              運営者は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
            </p>
          </section>

          {/* 第10条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第10条（利用規約の変更）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              運営者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
            </p>
          </section>

          {/* 第11条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第11条（個人情報の取扱い）
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              運営者は、本サービスの利用によって取得する個人情報については、運営者「プライバシーポリシー」に従い適切に取り扱うものとします。
            </p>
          </section>

          {/* 第12条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第12条（通知または連絡）
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              ユーザーと運営者との間の通知または連絡は、運営者の定める方法によって行うものとします。運営者は、ユーザーから、運営者が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
            </p>
          </section>

          {/* 第13条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第13条（権利義務の譲渡の禁止）
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              ユーザーは、運営者の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
            </p>
          </section>

          {/* 第14条 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              第14条（準拠法・裁判管轄）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              本規約の解釈にあたっては、日本法を準拠法とします。
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              本サービスに関して紛争が生じた場合には、運営者の本店所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
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
            <Link href="/privacy" className="hover:text-white transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors font-semibold">
              利用規約
            </Link>
            <Link href="/transactions" className="hover:text-white transition-colors">
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
