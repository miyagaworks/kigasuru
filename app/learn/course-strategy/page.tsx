'use client';

import Link from 'next/link';
import { ArrowLeft, Target, Wind, TrendingDown, TrendingUp, CheckCircle, AlertTriangle, BarChart3, Lightbulb, BookOpen } from 'lucide-react';

export default function CourseStrategy() {
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
              実践する
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            <span className="sm:hidden">
              データに基づいた
              <br />
              実践とコース戦略
            </span>
            <span className="hidden sm:inline">
              データに基づいた実践と
              <br />
              コース戦略
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto text-justify md:text-center">
            感覚から精度データへ。
            <br />
            実際のラウンドで、データをどう活用するのか？
          </p>
        </div>

        {/* イントロダクション */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border-2 border-gray-100">
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              前章までで、記録がもたらす確実な成長サイクルを見てきました。
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              では、実際のラウンドで、このデータをどのように活用すればいいのでしょうか？
            </p>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              この章では、データを使った具体的な実践方法とコース戦略について解説します。
            </p>
          </div>
        </section>

        {/* 感覚から精度データへ */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 border-2 border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <Lightbulb size={48} className="text-slate-700 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-gray-900">
                感覚から精度データへ
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              最も重要な考え方の転換があります。
            </p>
            <p className="text-2xl font-bold text-slate-800">
              それは、「感覚」から「精度データ」へのシフトです。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={24} className="text-slate-600" />
                従来の感覚的な判断
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="italic">「このクラブなら届く気がする」</p>
                <p className="italic">「今日は調子が良いから、攻めていこう」</p>
                <p className="italic">
                  「このホール、いつも上手くいくんだよな」
                </p>
              </div>
              <div className="mt-4 bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  これらは全て、
                  <strong className="text-slate-700">
                    「気がする」という曖昧な感覚
                  </strong>
                  に基づいた判断です。
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
                <CheckCircle size={24} className="text-emerald-600" />
                データに基づいた判断
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">
                  「このクラブで、この条件なら、平均精度は15ヤード」
                </p>
                <p className="font-semibold">
                  「このアプローチ、左足下がりでは右に10ヤードずれる傾向がある」
                </p>
                <p className="font-semibold">
                  「アゲンストでは、いつも10ヤード足りない」
                </p>
              </div>
              <div className="mt-4 bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong className="text-emerald-600">
                    具体的なデータに基づいて、合理的な判断
                  </strong>
                  ができるようになるのです。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* データに基づいたクラブ選択 */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 border-2 border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <Target size={48} className="text-slate-700 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-gray-900">
                データに基づいた
                <br />
                クラブ選択
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              ゴルフで最も重要な判断の一つが、クラブ選択です。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              多くのアマチュアゴルファーは、「このクラブで○○ヤード飛ぶ」という固定観念を持っています。
            </p>
            <div className="bg-slate-100 rounded-xl p-6 mb-6">
              <p className="text-2xl font-bold text-gray-900 text-center">
                「7番アイアンは150ヤード」
              </p>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              しかし、実際にデータを取ってみると、どうでしょうか？
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <BarChart3 size={32} className="text-slate-700" />
              実際のデータ例
            </h3>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 mb-6">
              <h4 className="font-bold text-gray-900 mb-4">
                7番アイアンの飛距離
                <br />
                <span className="text-sm font-normal text-gray-600">
                  （フェアウェイ、平坦なライ、フルスイング、過去50ショット）
                </span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">最大</span>
                  <span className="font-bold text-lg">
                    158ヤード{" "}
                    <span className="text-sm text-gray-600">（フォロー）</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">最小</span>
                  <span className="font-bold text-lg">
                    132ヤード{" "}
                    <span className="text-sm text-gray-600">
                      （アゲンスト）
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between border-t-2 border-slate-300 pt-3">
                  <span className="text-gray-900 font-semibold">平均</span>
                  <span className="font-bold text-xl text-slate-800">
                    145ヤード
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-4">
                ※ラフや傾斜など、条件が悪い場合は、この数値より飛距離が落ちることに注意
              </p>
            </div>

            <div className="bg-slate-100 border-l-4 border-slate-400 rounded-r-xl p-6 mb-6">
              <p className="text-lg text-gray-900 mb-3">
                そして、さらに重要なデータがこれです。
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 mb-6 border-2 border-slate-400">
              <h4 className="font-bold text-gray-900 mb-4">
                150ヤード地点を狙った時の結果
                <br />
                <span className="text-sm font-normal text-gray-600">
                  （7番アイアン、フルスイング、フェアウェイ）
                </span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">平均到達距離</span>
                  <span className="font-bold text-lg">143ヤード</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">目標からのズレ</span>
                  <span className="font-bold text-lg text-slate-700">
                    平均7ヤードショート
                  </span>
                </div>
                <div className="flex items-center justify-between border-t-2 border-slate-300 pt-3">
                  <span className="text-gray-900 font-semibold">
                    目標地点からの平均精度
                  </span>
                  <span className="font-bold text-xl text-slate-800">
                    9ヤード
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-2xl p-6">
              <p className="text-xl font-bold mb-4">
                この数字を見て、どう思いますか？
              </p>
              <p className="text-lg leading-relaxed mb-4 text-justify">
                「7番アイアンは150ヤード」と思っていたのに、実際には
                <strong>平均7ヤードも届いていない</strong>のです。
              </p>
              <p className="text-lg leading-relaxed text-justify">
                これは、多くのゴルファーに共通する傾向です。自分の飛距離を、実際より過大評価しているのです。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              データを活かしたクラブ選択
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              では、残り150ヤードのショットで、グリーンに乗せる精度を最大化するには、どうすればいいでしょうか？
            </p>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
              <p className="text-xl font-bold text-emerald-700 mb-4">
                データがあれば、答えは明確です。
              </p>
              <p className="text-lg text-gray-900 font-semibold">
                6番アイアンで抑えめのスイング、あるいは7番アイアンでしっかりと振る
              </p>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed text-justify">
                6番アイアンの平均飛距離が160ヤードなら、抑えめに打てば、ちょうど150ヤード前後になります。
              </p>
              <p className="leading-relaxed text-justify">
                しかも、フルスイングより力みがなく、方向性も安定します。
              </p>
              <p className="leading-relaxed text-justify">
                あるいは、7番アイアンでフルスイングよりも、しっかりとしたスイングを意識することで、平均7ヤードのショート傾向を補正できます。
              </p>
            </div>
            <div className="mt-6 bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
              <p className="text-lg text-gray-700 leading-relaxed mb-3 text-justify">
                実際、データを見ると、精度の違いが明確です。
              </p>
              <p className="text-xl font-bold text-slate-800">
                「同じ150ヤードを狙うなら、どのクラブで、どの強さで打つのが最も精度が高いか」
              </p>
            </div>
            <div className="mt-6 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl p-6">
              <p className="text-2xl font-bold">
                これが、データに基づいたクラブ選択です。
              </p>
            </div>
          </div>
        </section>

        {/* 条件別のデータ活用 */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 border-2 border-slate-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              条件別のデータ活用
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              ゴルフは、常に様々な条件下でプレーします。
            </p>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              データが蓄積されると、<strong>条件別の傾向</strong>
              が見えてきます。
            </p>
          </div>

          <div className="bg-slate-100 border-l-4 border-slate-400 rounded-r-xl p-6 mb-8">
            <p className="text-lg font-bold text-slate-800 mb-3">
              ⚠️ 重要：一般論ではなく、あなたのデータが必要
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              以下は、データが蓄積された場合の具体例です。
            </p>
            <p className="text-xl font-bold text-gray-900 text-justify">
              重要なのは、これらはあくまで具体例であり、
              <span className="text-slate-700">
                あなたの傾向は異なる可能性が高い
              </span>
              ということです。
            </p>
            <p className="text-gray-700 mt-3 leading-relaxed text-justify">
              雑誌やYouTubeの一般論でもなく、他人の事例でもなく、
              <strong className="text-gray-900">あなた固有のデータ</strong>
              が、あなたの戦略を作るのです。
            </p>
          </div>

          {/* 傾斜別の例 */}
          <div className="space-y-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                【例1】Aさんの左足下がりでの傾向
              </h3>
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">
                      平坦なライでの平均精度
                    </span>
                    <span className="font-semibold">8ヤード</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">
                      左足下がりでの平均精度
                    </span>
                    <span className="font-semibold text-slate-700">
                      14ヤード
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2">
                    <span className="text-gray-900 font-semibold">
                      Aさんの傾向
                    </span>
                    <span className="font-bold text-slate-800">
                      右方向へ5ヤード行く傾向が判明
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                <p className="font-semibold text-emerald-700 mb-2">Aさんの対策</p>
                <p className="text-gray-700 text-sm">
                  番手を一つ上げて、フェースが開かないように打つ
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                【例2】Bさんのつま先上がりでの傾向
              </h3>
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">
                      平坦なライでの平均精度
                    </span>
                    <span className="font-semibold">8ヤード</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">
                      つま先上がりでの平均精度
                    </span>
                    <span className="font-semibold text-slate-700">
                      13ヤード
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2">
                    <span className="text-gray-900 font-semibold">
                      Bさんの傾向
                    </span>
                    <span className="font-bold text-slate-800">
                      左方向へ6ヤード行く傾向が判明
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                <p className="font-semibold text-emerald-700 mb-2">Bさんの対策</p>
                <p className="text-gray-700 text-sm">
                  右を狙い、フェースが被らないように打つ
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                【例3】Cさんの複合傾斜での傾向
              </h3>
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">
                      左足下がり + つま先下がり
                    </span>
                    <span className="font-semibold text-slate-700">
                      平均精度20ヤード
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                <p className="font-semibold text-emerald-700 mb-2">Cさんの対策</p>
                <p className="text-gray-700 text-sm">
                  セットアップを改善し、最も安定するショットを見つける
                </p>
              </div>
            </div>
          </div>

          {/* 風向き別 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Wind className="text-slate-700" size={32} />
              風向き別の対策
            </h3>

            <div className="space-y-6">
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingDown className="text-slate-700" size={24} />
                  向かい風での傾向（例）
                </h4>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">無風時の平均精度</span>
                    <span className="font-semibold">9ヤード</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">向かい風時の平均精度</span>
                    <span className="font-semibold text-slate-700">
                      15ヤード
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2">
                    <span className="text-gray-900 font-semibold">
                      ショート方向へのズレ
                    </span>
                    <span className="font-bold text-slate-800">
                      平均10ヤード
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="font-semibold text-emerald-700 mb-2">対策例</p>
                  <p className="text-gray-700 text-sm">番手を二つ上げる</p>
                </div>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-emerald-600" size={24} />
                  追い風での傾向（例）
                </h4>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">無風時の平均精度</span>
                    <span className="font-semibold">8ヤード</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">追い風時の平均精度</span>
                    <span className="font-semibold text-emerald-600">
                      11ヤード
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-emerald-200 pt-2">
                    <span className="text-gray-900 font-semibold">
                      オーバー方向へのズレ
                    </span>
                    <span className="font-bold text-emerald-700">
                      平均8ヤード
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="font-semibold text-emerald-700 mb-2">対策例</p>
                  <p className="text-gray-700 text-sm">番手を一つ下げる</p>
                </div>
              </div>
            </div>
          </div>

          {/* ライ別 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              ライ別の対策
            </h3>

            <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-300">
              <h4 className="font-bold text-gray-900 mb-4">
                深いラフでの傾向（例）
              </h4>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    フェアウェイからの平均精度
                  </span>
                  <span className="font-semibold">6ヤード</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">深いラフからの平均精度</span>
                  <span className="font-semibold text-slate-700">23ヤード</span>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p className="text-gray-700 text-sm">
                    飛距離も方向性も大きくブレる
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-slate-800 mb-2">対策例</p>
                <p className="text-gray-700 text-sm">
                  グリーンを狙わず、フェアウェイに出すことを優先
                </p>
              </div>
            </div>

            <div className="mt-6 bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
              <p className="text-lg text-gray-700 leading-relaxed text-justify">
                これらは全て、
                <strong className="text-slate-800">
                  あなた自身のデータから導き出された対策
                </strong>
                です。
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-3 text-justify">
                雑誌やYouTubeで「一般論」として言われていることではなく、
                <strong className="text-gray-900">あなた固有の傾向</strong>
                なのです。
              </p>
            </div>
          </div>
        </section>

        {/* 自分を知ることで生まれる戦略 */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 border-2 border-slate-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              自分を知ることで生まれる、
              <br />
              本当の戦略
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              データが蓄積されると、驚くべきことが起こります。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <p className="text-xl font-bold text-slate-800 mb-6">
              自分が何者なのか、ゴルファーとして何が得意で何が苦手なのか、初めて正確に理解できるのです。
            </p>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              多くのアマチュアゴルファーは、「ピッチングウェッジは得意な気がする」という曖昧な自己認識でプレーしています。
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              しかし、それは本当でしょうか？
            </p>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 mb-6">
              <p className="text-gray-700 leading-relaxed text-justify">
                データを取ってみると、事実が見えてきます。
              </p>
              <p className="text-lg font-semibold text-slate-800 mt-3 italic">
                「得意だと思っていた120ヤードのアプローチ、実はオーバーすることが多く、難しいパットが残っていた」
              </p>
            </div>
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl p-6">
              <p className="text-2xl font-bold mb-4">
                データは、思い込みを破壊します。
              </p>
              <p className="text-lg leading-relaxed text-justify">
                そして、本当の自分を知った時、初めて「自分に合った戦略」が見えてくるのです。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              無理をしない戦略
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              従来のゴルフでは、「攻める」ことが美徳とされてきました。
            </p>
            <div className="bg-slate-100 rounded-xl p-6 mb-6">
              <p className="text-gray-700 leading-relaxed mb-2">
                「残り200ヤード、3番ウッドで狙ってみよう」
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                「深いラフからでも、グリーンを狙う」
              </p>
              <p className="text-gray-700 leading-relaxed">
                「残り150ヤード、グリーンを狙う」
              </p>
            </div>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
              <p className="text-lg font-bold text-gray-900 mb-4">
                しかし、データがあれば、こう考えるようになります。
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                「この条件での自分の精度は、平均20ヤードもずれる。狙うべきではない」
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                「この状況で無理をして、ダブルボギーになるリスクを冒すより、確実にボギーで収める方が賢い」
              </p>
              <p className="text-gray-700 leading-relaxed">
                「力んで失敗するより、冷静に抑えめのスイングでパーを取る方が、結果的にスコアは良くなる」
              </p>
            </div>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-8">
              <p className="text-2xl font-bold mb-4">
                これは消極的な戦略ではありません。
                <br />
                むしろ、最も攻撃的な戦略です。
              </p>
              <p className="text-lg leading-relaxed mb-4 text-justify">
                なぜなら、「自分の実力で確実に達成できること」を積み重ねることが、最もスコアを縮める方法だからです。
              </p>
              <p className="text-lg leading-relaxed text-justify">
                プロゴルファーが「マネジメント」を重視するのは、この理解があるからです。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              条件を味方につける戦略
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              データを蓄積すると、もう一つ重要なことが分かります。
            </p>
            <p className="text-xl font-bold text-gray-900 mb-6">
              「自分は、どの条件に強く、どの条件に弱いのか」
            </p>
            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
                <p className="text-gray-700">
                  「アゲンストの時、自分はいつも距離を過小評価している。2番手上げるべきだ」
                </p>
              </div>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                <p className="text-gray-700">
                  「左足下がりでは、右に行く傾向がある。それを意識してアドレスしよう」
                </p>
              </div>
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
                <p className="text-gray-700">
                  「フェアウェイバンカーからは、精度が極端に落ちる。絶対に避けるべきだ」
                </p>
              </div>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 mb-6">
              <p className="text-lg text-gray-700 leading-relaxed text-justify">
                こうした発見は、
                <strong className="text-slate-800">自分だけの武器</strong>
                になります。
              </p>
              <p className="text-gray-700 mt-3 text-justify">
                雑誌やYouTubeの一般論ではなく、あなた固有の傾向だからです。
              </p>
            </div>
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl p-6">
              <p className="text-lg leading-relaxed mb-4 text-justify">
                そして、この理解があれば、ティーショットの段階で、「次のショットがどういう条件になるか」を計算してプレーできるようになります。
              </p>
              <p className="text-2xl font-bold">
                条件を敵と見るのではなく、味方につける。これがデータの力です。
              </p>
            </div>
          </div>
        </section>

        {/* まとめ */}
        <section className="mb-12">
          <div className="bg-gray-900 text-white rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6">まとめ</h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p>✓ 「感覚」から「精度データ」へのシフトが重要</p>
              <p>✓ データがあれば、クラブ選択が合理的になる</p>
              <p>✓ 条件別の傾向は、あなた固有のもの（一般論とは異なる）</p>
              <p>✓ 自分を知ることで、無理をしない戦略が立てられる</p>
              <p>✓ 条件を味方につけることで、スコアは確実に縮まる</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-16">
          <div className="bg-gradient-to-r from-[var(--color-primary-green)] to-green-600 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              あなただけの戦略を
              <br className="sm:hidden" />
              データで作り上げる
            </h2>
            <p className="text-lg md:text-xl mb-10 leading-relaxed text-justify md:text-center">
              次のラウンドから、データに基づいた
              <br />
              合理的なプレーを始めましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-primary-green)] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                <Target className="w-5 h-5" />
                アプリをダウンロード
              </Link>
              <Link
                href="/learn/realistic-expectations"
                className="bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition-colors"
              >
                次：現実的な期待値 →
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
              href="/learn/growth-cycle"
              className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100 hover:border-[var(--color-primary-green)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-[var(--color-primary-green)]" />
                <h4 className="font-bold text-gray-900 text-lg">
                  ← 成長サイクル
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-justify">
                記録と練習の両輪で実現する、確実な上達の仕組み。
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
