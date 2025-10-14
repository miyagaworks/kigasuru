'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Target,
  Award,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  BookOpen
} from 'lucide-react';

export default function GrowthCycle() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
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
          <div className="inline-block mb-6 px-6 py-2 bg-slate-100 rounded-full">
            <span className="text-slate-700 text-sm font-semibold tracking-wide">
              成長する
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            データ記録と練習の
            <br className="md:hidden" />
            両輪で
            <br className="hidden md:block" />
            実現する
            <br className="md:hidden" />
            成長サイクル
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto text-justify md:text-center">
            記録を続けると、どのような変化が起こるのか？
            <br />
            着実な成長を生み出す仕組みを解説します。
          </p>
        </div>

        {/* イントロダクション */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border-2 border-gray-100">
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              前章では、記録することの重要性と、何を記録すべきかを見てきました。
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              では、実際に記録を続けると、どのような変化が起こるのでしょうか？
            </p>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 md:p-8 border-l-4 border-emerald-600">
              <div className="flex items-start gap-3 mb-4">
                <Lightbulb
                  className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-1"
                  strokeWidth={2.5}
                />
                <p className="text-xl font-bold text-emerald-700">
                  練習場での基礎練習とラウンドでのデータ記録。この両輪を回すことで、着実に上達していきます。
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed text-justify">
                重要なのは、データ記録は「練習場での練習」を否定するものではないということです。むしろ、
                <strong>練習の効果を最大化するための羅針盤</strong>なのです。
              </p>
            </div>
          </div>
        </section>

        {/* 成長サイクルの図解 */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 border-2 border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <RefreshCw size={48} className="text-slate-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                確実な成長サイクル
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              記録によって、以下のサイクルが回り始めます。
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-gray-400">
              <div className="flex items-start gap-4">
                <span className="bg-gray-100 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  1
                </span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    ラウンドでデータを記録する
                  </h3>
                  <p className="text-gray-600">
                    一打一打の条件、選択、結果を正確に記録
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="text-gray-400 text-3xl">↓</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-gray-500">
              <div className="flex items-start gap-4">
                <span className="bg-gray-200 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  2
                </span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    自分の弱点・傾向が見える
                  </h3>
                  <p className="text-gray-600">
                    データ分析により、苦手クラブや条件別の傾向が明確に
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="text-gray-500 text-3xl">↓</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-slate-600">
              <div className="flex items-start gap-4">
                <span className="bg-slate-100 text-slate-600 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  3
                </span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    練習場で弱点を集中的に練習する
                  </h3>
                  <p className="text-gray-600">
                    ワースト5クラブの原因を追求し、基本を見直す
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="text-slate-600 text-3xl">↓</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-gray-600">
              <div className="flex items-start gap-4">
                <span className="bg-gray-300 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  4
                </span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    次のラウンドで改善を確認する
                  </h3>
                  <p className="text-gray-600">
                    練習の成果を実戦で試し、データで検証
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="text-gray-600 text-3xl">↓</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-gray-700">
              <div className="flex items-start gap-4">
                <span className="bg-gray-400 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  5
                </span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    さらにデータを記録する
                  </h3>
                  <p className="text-gray-600">
                    改善された部分、新たな課題を記録
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="text-gray-700 text-3xl">↓</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-gray-800">
              <div className="flex items-start gap-4">
                <span className="bg-gray-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  6
                </span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    新たな課題が明確になる
                  </h3>
                  <p className="text-gray-600">
                    次に取り組むべきことが見えてくる
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-full px-6 py-3 flex items-center gap-2">
                <RefreshCw size={20} />
                <span className="font-bold">サイクルが続く...</span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-2xl p-8">
            <p className="text-xl font-bold mb-4">この流れを継続することで、</p>
            <p className="text-2xl font-bold">
              やみくもな練習から、目的を持った効率的な練習へと変わっていきます
            </p>
          </div>
        </section>

        {/* 1. 同じミスを繰り返さない */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 border-2 border-slate-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              1. 同じミスを繰り返さない
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              ゴルフで最も無駄なことは何でしょうか？
              <br />
              それは、<strong>同じミスを何度も繰り返すこと</strong>です。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <div className="bg-rose-50 rounded-xl p-6 mb-6">
              <p className="text-gray-700 leading-relaxed mb-2">
                「またこのホールで右のバンカーに入れてしまった」
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                「また同じクラブで距離が足りなかった」
              </p>
              <p className="text-gray-700 leading-relaxed">
                「また同じような場面で力んでしまった」
              </p>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              同じミスを繰り返しているということは、
              <strong className="text-rose-700">
                前回の経験を活かせていない
              </strong>
              ということです。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              記録がある場合の具体例
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              あなたがよくプレーするホームコースの7番ホール、パー4。
              <br />
              セカンドショットは残り150ヤード。グリーンは少し砲台で、手前にバンカーがあります。
            </p>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              ラウンド前の準備段階で、前回のデータを確認すると：
            </p>
            <div className="bg-slate-50 rounded-xl p-6 mb-6 border-l-4 border-slate-300">
              <p className="text-lg font-bold text-gray-900 mb-3">
                「このホール、7番アイアンで3回打って、3回とも手前のバンカー。平均で8ヤードショートしている」
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              このデータがあれば、今回は迷わず6番アイアンを選べます。
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              そして、見事グリーンセンターへ。
            </p>
            <div className="bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl p-6">
              <p className="text-xl font-bold text-emerald-700">
                これが、「データに基づいた学習」です。
              </p>
            </div>
          </div>

          <div className="mt-6 bg-gray-900 text-white rounded-2xl p-8">
            <p className="text-lg leading-relaxed mb-4">
              記録がなければ、「あのホール、なんかいつもバンカーに入るんだよな」という曖昧な記憶だけ。そして今回も同じように7番アイアンを選んで、同じようにバンカーに入っていたかもしれません。
            </p>
            <p className="text-xl font-bold text-green-400">
              データは、曖昧な記憶を明確な対策に変えるのです。
            </p>
          </div>
        </section>

        {/* 2. データが語る本当の傾向 */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 border-2 border-slate-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              2. データが語る「本当の傾向」
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              記録を続けていくと、自分でも気づいていなかった傾向が見えてきます。
            </p>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-6 mb-8">
            <p className="text-lg font-bold text-gray-900 mb-3">
              ⚠️ 重要な注意点
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>
                統計的に意味のある傾向を掴むには、ある程度のデータ数が必要
              </strong>
              だということです。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              データ蓄積の現実的なタイムライン
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              月に1回ラウンドする場合を例に考えてみましょう。
            </p>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-gray-300">
                <h4 className="font-bold text-gray-900 mb-3">クラブ別の傾向</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• 7番アイアン：1ラウンドで3-5回使用</li>
                  <li>• 3ヶ月で約12-15回のデータ</li>
                  <li>
                    • → 「このクラブは右に行きやすい」という傾向が見え始める
                  </li>
                </ul>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border-l-4 border-slate-300">
                <h4 className="font-bold text-gray-900 mb-3">傾斜別の傾向</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• 左足下がり：1ラウンドで1-3回遭遇</li>
                  <li>• 半年で約5-10回のデータ</li>
                  <li>• → 「この傾斜での自分の傾向」が見え始める</li>
                </ul>
              </div>

              <div className="bg-gray-100 rounded-xl p-6 border-l-4 border-gray-400">
                <h4 className="font-bold text-gray-900 mb-3">
                  特定ホールの傾向
                </h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• 同じコースの同じホール：月1回</li>
                  <li>• 3回プレーすれば傾向が見え始める</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-gray-100 rounded-xl p-6">
              <p className="text-lg font-bold text-gray-900 mb-3">
                つまり、すぐに全ての答えが出るわけではありません。
              </p>
              <p className="text-gray-700 leading-relaxed text-justify">
                しかし、だからこそ記録が大切なのです。記憶だけでは、3ヶ月前のショットを正確に覚えていることは不可能です。記録があれば、確実にデータは蓄積され、傾向は見えてきます。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              データ活用の段階的なアプローチ
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              データの信頼性は、蓄積量に比例します。そのため、
              <strong>段階的にデータを活用する</strong>という考え方が重要です。
            </p>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-l-4 border-gray-300">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-gray-400 text-white px-3 py-1 rounded-full text-sm">
                    初期段階
                  </span>
                  1〜3ラウンド
                </h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• データ数が少ないため、あくまで「参考値」として扱う</li>
                  <li>
                    •
                    「このクラブ、もしかしたら右に行きやすいかも」という「仮説」を立てる程度
                  </li>
                  <li>• まずはデータを貯めることを優先</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border-l-4 border-slate-400">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-slate-500 text-white px-3 py-1 rounded-full text-sm">
                    中期段階
                  </span>
                  4〜10ラウンド
                </h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• 各クラブで10〜30回程度のデータが貯まる</li>
                  <li>• 大まかな傾向が見え始める</li>
                  <li>
                    •
                    「このクラブは右に行く傾向がある」という傾向として活用できる
                  </li>
                  <li>• 練習場での練習内容に反映し始める</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-6 border-l-4 border-gray-500">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm">
                    長期段階
                  </span>
                  11ラウンド以上
                </h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• 各クラブで30回以上のデータが貯まる</li>
                  <li>• 統計的に信頼性の高い傾向として活用できる</li>
                  <li>
                    • 条件別（傾斜別、風向き別など）の詳細な分析も可能になる
                  </li>
                  <li>• 確信を持って戦略に組み込める</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl p-6">
              <p className="text-gray-900 font-bold mb-3">
                重要なのは、データが少ない段階でも「傾向を知るきっかけ」として価値があるということです。
              </p>
              <p className="text-gray-700 text-sm leading-relaxed text-justify">
                また、「ピンポイントな条件」（例：左足下がり、向かい風、ラフ、150ヤード）ではなく、「もう少し大まかな傾向」を掴むことが実用的です。「左足下がり全般での傾向」「向かい風全般での傾向」といった、ある程度大きなカテゴリーで傾向を掴みましょう。
              </p>
            </div>
          </div>
        </section>

        {/* 3. 苦手クラブを克服する */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 md:p-10 mb-8 shadow-xl border-2 border-slate-200">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              3. 苦手クラブを克服する
              <br />
              練習の最適化
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              多くのゴルファーは、練習場でこんな練習をしていませんか？
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-rose-50 rounded-xl p-4 text-center">
                <p className="text-rose-700 font-semibold">
                  ❌ なんとなく全クラブを打つ
                </p>
              </div>
              <div className="bg-rose-50 rounded-xl p-4 text-center">
                <p className="text-rose-700 font-semibold">
                  ❌ 得意なクラブばかり打つ
                </p>
              </div>
              <div className="bg-rose-50 rounded-xl p-4 text-center">
                <p className="text-rose-700 font-semibold">
                  ❌ 気分で好きなクラブを打つ
                </p>
              </div>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              これでは、得意なクラブばかり練習して、苦手なクラブは放置されたまま。当然、苦手は克服されません。
            </p>
            <div className="bg-emerald-50 rounded-xl p-6">
              <p className="text-xl font-bold text-emerald-700">
                しかし、データがあれば、目的を持った練習ができます。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Target className="text-slate-600" size={32} />
              ワースト5クラブの表示機能
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              記録アプリには、
              <strong>精度が悪い順にクラブをランキング表示する機能</strong>
              があります。
            </p>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
              <h4 className="font-bold text-gray-900 mb-4">
                あなたの苦手クラブ Top 5
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                （使用回数3回以上のクラブ対象）
              </p>
              <div className="space-y-3">
                <div className="bg-rose-50 rounded-lg p-4 border-l-4 border-rose-500">
                  <p className="font-bold text-gray-900">
                    1. 3番ウッド -{" "}
                    <span className="text-rose-700">平均精度 29Yd</span>{" "}
                    <span className="text-sm text-gray-600">
                      （15ショット）
                    </span>
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                  <p className="font-bold text-gray-900">
                    2. 5番アイアン -{" "}
                    <span className="text-amber-700">平均精度 26Yd</span>{" "}
                    <span className="text-sm text-gray-600">
                      （20ショット）
                    </span>
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-600">
                  <p className="font-bold text-gray-900">
                    3. 6番アイアン -{" "}
                    <span className="text-amber-700">平均精度 24Yd</span>{" "}
                    <span className="text-sm text-gray-600">
                      （25ショット）
                    </span>
                  </p>
                </div>
                <div className="bg-sky-50 rounded-lg p-4 border-l-4 border-sky-600">
                  <p className="font-bold text-gray-900">
                    4. 5番ウッド -{" "}
                    <span className="text-sky-700">平均精度 17Yd</span>{" "}
                    <span className="text-sm text-gray-600">
                      （19ショット）
                    </span>
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-emerald-500">
                  <p className="font-bold text-gray-900">
                    5. 9番アイアン -{" "}
                    <span className="text-emerald-700">平均精度 16Yd</span>{" "}
                    <span className="text-sm text-gray-600">
                      （32ショット）
                    </span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                ※平均精度：目標地点からの直線距離の平均値
              </p>
              <p className="text-xs text-gray-500">
                ※使用回数が少ないクラブは参考値として表示されます
              </p>
            </div>

            <div className="mt-6 bg-slate-50 rounded-xl p-6">
              <p className="text-lg text-gray-700 leading-relaxed mb-4 text-justify">
                これを見て、「5番アイアンがワースト2位かぁ」「9番アイアンも意外と精度が悪いんだな」という発見があるはずです。
              </p>
              <p className="text-xl font-bold text-slate-700">
                感覚と実際のデータは、しばしば一致しません。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              苦手クラブへの具体的な練習方法
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              ワースト5が分かったら、練習場ではこのクラブを集中的に練習します。
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-6 mb-6">
              <p className="font-bold text-gray-900 mb-3 text-justify">
                ここで重要なのは、「なぜそのクラブの精度が悪いのか」を考えるということです。
              </p>
            </div>

            <div className="mb-8">
              <h4 className="font-bold text-gray-900 mb-4 text-lg">
                例：5番アイアンが右に行く傾向がある場合
              </h4>

              <div className="bg-rose-50 rounded-xl p-6 mb-4">
                <p className="font-bold text-rose-700 mb-3">❌ 悪い練習</p>
                <p className="text-gray-700 leading-relaxed text-justify">
                  「右に行くから、目標を左に設定して打つ」
                </p>
                <p className="text-sm text-gray-600 mt-2 text-justify">
                  →
                  これは根本解決になりません。本番でも毎回「左を狙う」という不自然な対応が必要になります。
                </p>
              </div>

              <div className="bg-emerald-50 rounded-xl p-6">
                <p className="font-bold text-emerald-700 mb-4">⭕ 良い練習</p>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">
                      1. なぜ右に行くのかを考える
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• フェースが開いている？</li>
                      <li>• アウトサイドイン軌道？</li>
                      <li>• 体が開いている？</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">
                      2. 基本のスイングを見直す
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• グリップを確認</li>
                      <li>• アドレスで肩のラインをチェック</li>
                      <li>• スイング軌道を意識</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">
                      3. 正しいスイングの反復練習
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• 目標に対してスクエアに構え、スクエアに振る</li>
                      <li>• フェースをスクエアにインパクト</li>
                      <li>• これを50球、100球と繰り返す</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">
                      4. 次のラウンドで検証
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• 5番アイアンの平均精度が改善しているかチェック</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl p-6">
              <p className="text-xl font-bold mb-3">
                これが、データに基づいた練習の本質です。
              </p>
              <p className="leading-relaxed text-justify">
                データは「どこが悪いか」を教えてくれます。そして練習場で「なぜ悪いのか」「どう直すべきか」を追求する。この両輪が、上達の鍵なのです。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              レッスンプロの活用も視野に
            </h3>
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-6 mb-6">
              <p className="font-bold text-amber-700 mb-3">⚠️ 重要な注意点</p>
              <p className="text-gray-700 leading-relaxed text-justify">
                「なぜそのクラブの精度が悪いのか」を独学で正確に判断するのは、必ずしも容易ではありません。
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              データによって「5番アイアンが右に行く」という事実は明確になりますが、その原因が以下のどれなのかを特定するには、ある程度の知識と経験が必要です。
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <ul className="space-y-2 text-gray-700">
                <li>• グリップの握り方の問題</li>
                <li>• アドレスの向きやボールの位置の問題</li>
                <li>• スイング軌道の問題</li>
                <li>• フェースの開閉のタイミングの問題</li>
                <li>• 体の回転や体重移動の問題</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border-l-4 border-slate-300">
              <p className="text-lg font-bold text-gray-900 mb-4 text-justify">
                もし独学で改善が難しい場合は、データを持ってレッスンプロに相談することを強くお勧めします。
              </p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-gray-700 italic">
                  「5番アイアンが平均10ヤード右に行く傾向があります。原因を教えてください」
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed text-justify">
                このように、具体的なデータを持っていけば、レッスンプロも的確なアドバイスができます。やみくもに「スイングを見てください」と言うより、はるかに効率的です。
              </p>
            </div>

            <div className="mt-6 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl p-6">
              <p className="text-lg font-bold mb-3">
                データは問題を特定するツール。
                <br />
                解決方法は、練習場での反復練習とレッスンプロのアドバイスで身につける。
              </p>
              <p className="leading-relaxed text-justify">
                この役割分担を理解することが、効率的な上達の鍵です。
              </p>
            </div>
          </div>
        </section>

        {/* 4. 成長の見える化 */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 border-2 border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp size={48} className="text-slate-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                4. 成長の「見える化」が
                <br />
                モチベーションを生む
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              記録のもう一つの大きな利点は、<strong>成長が数値で見える</strong>
              ということです。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              従来のゴルフでは...
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                「今日は調子が良かった。上手くなった気がする！」
              </p>
              <p className="text-gray-600 text-sm">
                しかし、次のラウンドでは、また元通り。
              </p>
            </div>
            <p className="text-lg text-rose-700 font-bold">
              結局、「上手くなった気がする」は、単なる気のせいだったのです。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              なぜ「気のせい」になってしまうのか
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              理由は単純です。
              <strong className="text-gray-900">
                記憶は曖昧で、感覚は不安定だから
              </strong>
              です。
            </p>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border-l-4 border-slate-300">
                <p className="text-gray-700">
                  「今日は調子が良かった」と思っても、実際には、たまたま風が穏やかだっただけかもしれません。
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-gray-300">
                <p className="text-gray-700">
                  「6番アイアンの精度が上がった気がする」と思っても、実際には、たまたまフェアウェイからの平坦なライが多かっただけかもしれません。
                </p>
              </div>
            </div>
            <div className="mt-6 bg-gray-100 rounded-xl p-6">
              <p className="text-xl font-bold text-gray-900">
                条件が変われば、感覚も変わる。
                <br />
                だから、「気のせい」になってしまうのです。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Award className="text-slate-600" size={32} />
              記録があれば、成長は「事実」になる
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              しかし、記録があれば、状況は一変します。
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-8 text-justify">
              3ヶ月前の自分と、今の自分。データで比較すれば、成長は明確です。
            </p>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6 border-2 border-slate-300">
              <h4 className="font-bold text-gray-900 mb-4">
                6番アイアンの精度推移
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20">3ヶ月前</span>
                  <div
                    className="flex-1 bg-gray-300 h-8 rounded flex items-center px-3"
                    style={{ width: "100%" }}
                  >
                    <span className="text-sm font-semibold">
                      平均精度 24Yd（25ショット）
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20">2ヶ月前</span>
                  <div
                    className="flex-1 bg-gray-300 h-8 rounded flex items-center px-3"
                    style={{ width: "92%" }}
                  >
                    <span className="text-sm font-semibold">
                      平均精度 22Yd（24ショット）
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20">先月</span>
                  <div
                    className="flex-1 bg-slate-300 h-8 rounded flex items-center px-3"
                    style={{ width: "79%" }}
                  >
                    <span className="text-sm font-semibold">
                      平均精度 19Yd（26ショット）
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20">今月</span>
                  <div
                    className="flex-1 bg-slate-400 h-8 rounded flex items-center px-3 text-white"
                    style={{ width: "75%" }}
                  >
                    <span className="text-sm font-semibold">
                      平均精度 18Yd（25ショット）
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-slate-700 text-white rounded-lg p-4 text-center">
                <p className="text-xl font-bold">
                  → 3ヶ月で平均精度が6ヤード改善！
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
              <h4 className="font-bold text-gray-900 mb-4">
                ワースト1位クラブの変化
              </h4>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border-l-4 border-gray-400">
                  <p className="text-sm text-gray-600 mb-1">3ヶ月前</p>
                  <p className="text-lg font-bold text-gray-700">
                    3番ウッド（平均精度 29Yd）
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border-l-4 border-slate-400">
                  <p className="text-sm text-gray-600 mb-1">今月</p>
                  <p className="text-lg font-bold text-slate-700">
                    5番アイアン（平均精度 28Yd）
                  </p>
                </div>
              </div>
              <div className="mt-4 bg-slate-700 text-white rounded-lg p-4 text-center">
                <p className="text-xl font-bold">
                  → 3番ウッドは16ヤードまで改善し、ワースト5から脱出！
                </p>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-2xl p-8">
              <p className="text-2xl font-bold mb-4">
                これは、気のせいではありません。事実です。
              </p>
              <p className="text-lg leading-relaxed mb-6 text-justify">
                そして、事実として成長が見えることが、次の練習、次のラウンドへのモチベーションになります。
              </p>
              <div className="bg-white/20 rounded-xl p-4">
                <p className="mb-2">「次は、5番アイアンの精度を上げよう」</p>
                <p>「ワースト1位でも平均精度20ヤード以内を目指そう」</p>
              </div>
              <p className="text-lg font-bold mt-6 text-justify">
                ゲームのようにレベルアップしていく感覚。しかも、それが「気のせい」ではなく「数値で証明された成長」だと分かる。
              </p>
              <p className="text-xl font-bold mt-4">
                これが、記録アプリの最大の魅力です。
              </p>
            </div>
          </div>
        </section>

        {/* 確実な成長サイクルの完成 */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 border-2 border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <RefreshCw size={48} className="text-slate-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                確実な成長サイクルの完成
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              ここまで見てきた要素を組み合わせると、以下のような
              <strong>確実な成長サイクル</strong>が完成します。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="bg-gray-400 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  1
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    ラウンドで記録する
                  </h3>
                  <p className="text-gray-600 text-sm">
                    → ショットのデータが蓄積される
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-gray-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  2
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    データを分析する
                  </h3>
                  <p className="text-gray-600 text-sm">
                    → 自分の傾向、苦手クラブが明確になる
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-slate-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  3
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    練習場で集中練習
                  </h3>
                  <p className="text-gray-600 text-sm">
                    → ワースト5クラブの「なぜ悪いのか」を追求し、基本を見直す
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-gray-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  4
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    次のラウンドで実践
                  </h3>
                  <p className="text-gray-600 text-sm">
                    → 改善した技術を実戦で試す
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-gray-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  5
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    改善を確認する
                  </h3>
                  <p className="text-gray-600 text-sm">
                    → データで成長を数値化
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-slate-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  6
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    次の課題へ
                  </h3>
                  <p className="text-gray-600 text-sm">
                    → 新たなワースト5に取り組む
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-2xl p-8">
            <p className="text-2xl font-bold mb-6">
              このプロセスを繰り返し続ける限り、
              <br />
              あなたは着実に成長し続けます。
            </p>
            <p className="text-lg leading-relaxed mb-6 text-justify">
              重要なのは、
              <strong>
                「データ記録」と「練習場での基礎練習」は対立するものではなく、補完し合うもの
              </strong>
              だということです。
            </p>
            <div className="bg-white/20 rounded-xl p-6">
              <ul className="space-y-3 text-lg">
                <li>• データは「何を練習すべきか」を教えてくれる</li>
                <li>• 練習場は「どう直すべきか」を身につける場</li>
                <li>• ラウンドは「改善を確認する」実践の場</li>
              </ul>
            </div>
          </div>
        </section>

        {/* まとめ */}
        <section className="mb-12">
          <div className="bg-gray-900 text-white rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6">まとめ</h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p>✓ 記録により、同じミスを繰り返さなくなる</p>
              <p>✓ データが蓄積されると、自分の本当の傾向が見えてくる</p>
              <p>
                ✓ ワースト5クラブを集中的に練習することで、効率的に上達できる
              </p>
              <p>✓ 成長が数値で見えるため、モチベーションが続く</p>
              <p>✓ 記録と練習の両輪を回すことで、確実に成長し続ける</p>
            </div>
            <div className="mt-8 bg-white/10 rounded-xl p-6">
              <p className="text-xl font-bold">
                もう、「なんとなく練習して、なんとなくラウンドして、なんとなく同じスコア」という状態から抜け出せます。
              </p>
              <p className="text-lg mt-4 text-justify">
                全てのラウンドが学びとなり、全ての練習が目的を持ったものになります。
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-16">
          <div className="bg-gradient-to-r from-[var(--color-primary-green)] to-green-600 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              確実な成長サイクルを
              <br className="sm:hidden" />
              今すぐ始めましょう
            </h2>
            <p className="text-lg md:text-xl mb-10 leading-relaxed text-justify md:text-center">
              記録と練習の両輪を回せば、
              <br />
              あなたは確実に成長し続けます。
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
                href="/learn/course-strategy"
                className="bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition-colors"
              >
                次：コース戦略 →
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
              href="/learn/why-recording"
              className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100 hover:border-[var(--color-primary-green)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-[var(--color-primary-green)]" />
                <h4 className="font-bold text-gray-900 text-lg">
                  ← なぜ記録が重要か
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-justify">
                何を記録し、どう活用するのか。記録の具体的な方法を解説。
              </p>
            </Link>
            <Link
              href="/learn/realistic-expectations"
              className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100 hover:border-[var(--color-primary-green)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-[var(--color-primary-green)]" />
                <h4 className="font-bold text-gray-900 text-lg">
                  現実的な期待値 →
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-justify">
                このアプリで何ができて、何ができないのか。正直にお伝えします。
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
