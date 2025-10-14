'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';

export default function RealisticExpectations() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
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
        {/* タイトルセクション */}
        <div className="mb-16 text-center">
          <div className="inline-block mb-6 px-6 py-2 bg-amber-100 rounded-full">
            <span className="text-amber-800 text-sm font-semibold tracking-wide">
              正直に伝える
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            現実的な期待値：
            <br />
            このアプリで何ができて、
            <br />
            何ができないのか
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto text-justify md:text-center">
            正直に、誠実にお伝えします。
            <br />
            魔法のアプリではありません。しかし、着実に成長できるツールです。
          </p>
        </div>

        {/* 重要な前提 */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-4 border-amber-400 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <AlertTriangle size={48} className="text-amber-700" />
              <h2 className="text-3xl font-bold text-gray-900">
                最も重要な前提
              </h2>
            </div>
            <p className="text-2xl font-bold text-amber-800 mb-6">
              「アプリを入れただけで上手くなる」<br />という魔法はありません
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              このアプリは、あなたのゴルフを劇的に変える可能性を持っています。しかし、それはあなた自身が以下のことを実践する場合に限ります。
            </p>
            <div className="bg-white rounded-xl p-6">
              <ul className="space-y-3 text-gray-900">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 font-bold text-xl mt-1">•</span>
                  <span className="text-lg"><strong>継続的に記録する</strong>（ラウンドの度に、一打一打を記録する習慣）</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 font-bold text-xl mt-1">•</span>
                  <span className="text-lg"><strong>データを分析する</strong>（アプリが提示する傾向を理解する）</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 font-bold text-xl mt-1">•</span>
                  <span className="text-lg"><strong>練習場で練習する</strong>（苦手クラブの原因を追求し、基本を見直す）</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 font-bold text-xl mt-1">•</span>
                  <span className="text-lg"><strong>次のラウンドで実践する</strong>（改善した技術を試し、データで検証する）</span>
                </li>
              </ul>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mt-6">
              この4つのサイクルを回し続けることで、初めて着実な成長が実現します。
            </p>
          </div>
        </section>

        {/* このアプリが効果的な人 */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <CheckCircle2 size={48} className="text-emerald-700" />
              <h2 className="text-3xl font-bold text-gray-900">
                このアプリが<br />効果的な方
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              以下に該当する方には、このアプリは強力なツールになります。
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    平均スコア90〜110のアマチュアゴルファー
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    基本的なスイングはできるが、コースに出ると安定しない。どこを改善すれば良いか分からない。そんな方に最適です。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    データ分析や数値管理が好きな方
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    感覚ではなく、データで自分を知りたい。合理的に上達したい。そんな考え方の方には、このアプリは最高のパートナーになります。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    練習する意欲がある方
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    データで弱点が分かっても、練習しなければ改善しません。「練習場で練習する時間がある」「改善する意欲がある」という方に有効です。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    継続的に記録する習慣がつく方
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    最初の数ラウンドは面倒に感じるかもしれません。しかし、習慣になれば苦になりません。「継続できる」という方に最適です。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    月に1回以上ラウンドする方
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    データは蓄積されるほど価値が高まります。年に数回しかラウンドしない場合、データ蓄積に時間がかかりますが、月1回以上なら効果的です。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 効果が限定的な方 */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <XCircle size={48} className="text-gray-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                効果が限定的な方
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              以下に該当する方には、残念ながらこのアプリの効果は限定的です。
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200">
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="text-gray-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    ゴルフを始めたばかりの初心者
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    基本的なスイングができない段階では、データ分析よりもまずレッスンや基礎練習が優先です。スコア120以上の方は、まず基本を身につけましょう。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200">
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="text-gray-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    練習する時間がない方
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    データで弱点が分かっても、練習しなければ改善しません。「ラウンドは行くが、練習場には行かない」という方には、効果は限定的です。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200">
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="text-gray-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    記録を継続できない方
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    最初の1〜2ラウンドだけ記録して、その後は記録しない。これではデータが蓄積されず、傾向も見えてきません。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200">
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="text-gray-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    「アプリを入れただけで上手くなる」と考える方
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    このアプリは魔法のツールではありません。記録し、分析し、練習し、実践する。このサイクルを回す意欲がない方には、効果はありません。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 期待できる効果 */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp size={48} className="text-sky-700" />
              <h2 className="text-3xl font-bold text-gray-900">
                期待できる効果
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              継続的に記録し、練習し、実践すれば、以下の効果が期待できます。
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-sky-600">
              <h3 className="text-xl font-bold text-sky-700 mb-3">
                ✓ 苦手クラブが明確になり、練習の優先順位がつく
              </h3>
              <p className="text-gray-600 leading-relaxed">
                「なんとなく全クラブを打つ」練習から、「ワースト5クラブを集中的に練習する」目的を持った練習へ。
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-emerald-600">
              <h3 className="text-xl font-bold text-emerald-700 mb-3">
                ✓ 同じミスを繰り返す頻度が減る
              </h3>
              <p className="text-gray-600 leading-relaxed">
                「またこのホールでバンカーに入れた」という失敗が、「前回のデータを見て、今回は6番アイアンで無事クリア」という成功に変わります。
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-violet-600">
              <h3 className="text-xl font-bold text-violet-700 mb-3">
                ✓ コースマネジメントが改善され、無理な攻めが減る
              </h3>
              <p className="text-gray-600 leading-relaxed">
                「この条件での自分の精度は20ヤード。無理に攻めず、確実にフェアウェイへ」という冷静な判断ができるようになります。
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-amber-600">
              <h3 className="text-xl font-bold text-amber-700 mb-3">
                ✓ 条件別の対策が立てられる
              </h3>
              <p className="text-gray-600 leading-relaxed">
                「左足下がりでは右に行く傾向がある」「アゲンストでは2番手上げる」など、あなた固有の対策が確立されます。
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-8">
            <p className="text-2xl font-bold mb-4">
              結果として
            </p>
            <p className="text-3xl font-bold mb-6">
              平均3〜7打のスコア改善
            </p>
            <p className="text-lg leading-relaxed mb-4">
              （個人差があります。3〜6ヶ月継続した場合）
            </p>
            <div className="bg-white/20 rounded-xl p-6">
              <p className="text-sm leading-relaxed">
                ※これは「魔法のように一瞬で」ではなく、「データを蓄積し、練習し、実践するサイクルを3〜6ヶ月継続した場合」の現実的な数値です。
              </p>
            </div>
          </div>
        </section>

        {/* 期待できない効果 */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <XCircle size={48} className="text-rose-700" />
              <h2 className="text-3xl font-bold text-gray-900">
                期待できない効果
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              正直にお伝えします。このアプリでは、以下のことはできません。
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                ❌ スイング自体が劇的に美しくなる
              </h3>
              <p className="text-gray-600 leading-relaxed">
                このアプリはスイング診断ツールではありません。「右に行く傾向がある」という事実は分かりますが、「なぜ右に行くのか」「どう直せばいいのか」は、練習場での試行錯誤やレッスンプロのアドバイスが必要です。
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                ❌ 飛距離が大幅に伸びる
              </h3>
              <p className="text-gray-600 leading-relaxed">
                飛距離アップには、筋力トレーニングやスイングスピードの向上が必要です。このアプリは「自分の実際の飛距離を正確に知る」ことはできますが、飛距離を伸ばすトレーニング機能はありません。
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                ❌ 一瞬で上級者になる
              </h3>
              <p className="text-gray-600 leading-relaxed">
                「1週間でベストスコア更新！」のような即効性はありません。データの蓄積、傾向の把握、練習、実践。このサイクルを3〜6ヶ月継続することで、着実に成長します。
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                ❌ パッティングが劇的に上手くなる
              </h3>
              <p className="text-gray-600 leading-relaxed">
                このアプリは主に「グリーンまでのショット」のデータ分析に特化しています。パッティングの記録・分析機能は限定的です。
              </p>
            </div>
          </div>
        </section>

        {/* 成長のタイムライン */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Clock size={48} className="text-violet-700" />
              <h2 className="text-3xl font-bold text-gray-900">
                現実的な成長のタイムライン
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              月に1回ラウンドする場合の、現実的な成長の流れです。
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-gray-600">1-3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    1〜3ラウンド：データ蓄積フェーズ
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    まずはデータを貯めることが優先。記録する習慣をつける段階です。
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">• 一打一打を記録する習慣がつく</p>
                    <p className="text-sm text-gray-700 mb-2">• 「自分はこう思っていたが、実際は違う」という発見がある</p>
                    <p className="text-sm text-gray-700">• まだ統計的に信頼できるデータ数ではないが、傾向の「仮説」が立ち始める</p>
                  </div>
                </div>
              </div>
              <div className="bg-sky-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-sky-800">
                  スコア改善：±0〜2打（まだデータが少ない段階）
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-sky-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-sky-700">4-10</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    4〜10ラウンド：傾向発見フェーズ
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    データが蓄積され、明確な傾向が見えてくる段階です。
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">• 各クラブで10〜30回程度のデータが貯まる</p>
                    <p className="text-sm text-gray-700 mb-2">• 「このクラブは右に行きやすい」という傾向が明確になる</p>
                    <p className="text-sm text-gray-700 mb-2">• 練習場での練習内容が明確になる（ワースト5クラブを集中練習）</p>
                    <p className="text-sm text-gray-700">• 同じミスを繰り返す頻度が減り始める</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800">
                  スコア改善：平均2〜4打（傾向が見え、対策が立ち始める）
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-emerald-700">11+</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    11ラウンド以上：攻略完了フェーズ
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    統計的に信頼性の高いデータが貯まり、確信を持った戦略が立てられる段階です。
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">• 各クラブで30回以上のデータが貯まる</p>
                    <p className="text-sm text-gray-700 mb-2">• 条件別（傾斜別、風向き別）の詳細な対策が確立される</p>
                    <p className="text-sm text-gray-700 mb-2">• ホームコースの各ホールでの最適戦略が明確になる</p>
                    <p className="text-sm text-gray-700 mb-2">• コースマネジメントが確立され、無理な攻めが激減</p>
                    <p className="text-sm text-gray-700">• データに基づいた合理的なプレーが自然にできるようになる</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800">
                  スコア改善：平均3〜7打（データが蓄積され、戦略が確立）
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-2xl p-8">
            <p className="text-2xl font-bold mb-4">
              重要なポイント
            </p>
            <p className="text-lg leading-relaxed mb-4">
              これは「月に1回ラウンドする場合」の目安です。月に2回以上ラウンドするなら、より早く効果が現れます。逆に、年に数回しかラウンドしない場合は、時間がかかります。
            </p>
            <p className="text-lg leading-relaxed">
              <strong>しかし、どんなペースであれ、継続すれば確実に成長します。</strong>それがデータの力です。
            </p>
          </div>
        </section>

        {/* まとめ */}
        <section className="mb-16">
          <div className="bg-gray-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} />
              まとめ
            </h2>
            <div className="space-y-5 text-base md:text-lg leading-relaxed">
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>このアプリは魔法のツールではない</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>記録、分析、練習、実践のサイクルを回す必要がある</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>平均スコア90〜110、データ志向、練習意欲がある方に最適</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>期待できる効果は、3〜6ヶ月で平均3〜7打の改善</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>スイング改善や飛距離アップは、このアプリの目的ではない</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>データ蓄積には時間がかかるが、確実に成長できる</span>
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-16">
          <div className="bg-gradient-to-r from-[var(--color-primary-green)] to-green-600 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              継続する覚悟があるなら、
              <br className="sm:hidden" />
              今すぐ始めましょう
            </h2>
            <p className="text-lg md:text-xl mb-10 leading-relaxed text-justify md:text-center">
              記録し、分析し、練習し、実践する。
              <br />
              このサイクルを回す覚悟があるなら、
              <br />
              このアプリはあなたの最高のパートナーになります。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-primary-green)] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                <TrendingUp className="w-5 h-5" />
                アプリをダウンロード
              </Link>
              <Link
                href="/"
                className="bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition-colors"
              >
                トップページへ
              </Link>
            </div>
          </div>
        </section>

        {/* 関連コンテンツ */}
        <section>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[var(--color-primary-green)]" />
            関連コンテンツ
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/learn/why-golf-is-hard"
              className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100 hover:border-[var(--color-primary-green)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-6 h-6 text-[var(--color-primary-green)]" />
                <h4 className="font-bold text-gray-900 text-lg">
                  ← ゴルフが難しい理由
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-justify">
                なぜ練習場とコースでこれほど違うのか。2つの敵と曖昧な記憶の問題を解説。
              </p>
            </Link>
            <Link
              href="/learn/growth-cycle"
              className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100 hover:border-[var(--color-primary-green)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6 text-[var(--color-primary-green)]" />
                <h4 className="font-bold text-gray-900 text-lg">
                  成長サイクル →
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-justify">
                記録と練習の両輪で実現する、確実な上達の仕組みを解説します。
              </p>
            </Link>
          </div>
        </section>
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
        </div>
      </footer>
    </div>
  );
}
