'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Smartphone,
  TrendingUp,
  Database,
  Mountain,
  Wind,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Eye,
  Lightbulb,
  Zap,
  BookOpen
} from 'lucide-react';
import { useExternalBrowser } from '@/hooks/useExternalBrowser';
import { BrowserInstructionsModal } from '@/components/BrowserInstructionsModal';

export default function WhyRecording() {
  const { deviceInfo, showBrowserInstructions, setShowBrowserInstructions, openInExternalBrowser } = useExternalBrowser();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* LINEアプリ内ブラウザの案内 */}
      <BrowserInstructionsModal
        isOpen={showBrowserInstructions}
        onClose={() => setShowBrowserInstructions(false)}
        deviceInfo={deviceInfo}
      />

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
            なぜ、「記録」が
            <br />
            これほど
            <br className="sm:hidden" />
            重要なのか？
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto text-justify md:text-center">
            曖昧な記憶を、正確なデータに変える。
            <br />
            それが、確実な成長への第一歩です。
          </p>
        </div>

        {/* イントロダクション */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border-2 border-gray-100">
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              前章で見てきたように、ゴルフの敵は「自然環境」と「自分自身」です。
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              そして、その戦いの記憶は驚くほど曖昧です。
            </p>
            <p className="text-xl font-bold text-[var(--color-primary-green)]">
              では、どうすればこの問題を解決できるのでしょうか？
            </p>
          </div>
        </section>

        {/* 答え */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-10 md:p-12 shadow-2xl text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Lightbulb className="w-10 h-10 text-white" strokeWidth={2.5} />
              <p className="text-2xl font-bold">答えは、シンプルです</p>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
              全てのショットを
              <br />
              記録すること
            </h2>
            <p className="text-xl leading-relaxed text-justify md:text-center">
              一打一打を正確に記録し、データとして蓄積する。
              <br />
              これが、最も効率的に上達する方法なのです。
            </p>
          </div>
        </section>

        {/* プロも記録している */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border-2 border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                プロゴルファーやトップアマは、
                <br className="hidden md:block" />
                徹底的に記録している
              </h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              プロゴルファーやトップアマチュアは、自分のラウンドを詳細に記録しています。
            </p>
            <div className="bg-slate-50 rounded-2xl p-6 md:p-8 mb-6 border border-slate-200">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle
                    className="w-5 h-5 text-sky-700 flex-shrink-0 mt-1"
                    strokeWidth={2}
                  />
                  <span>どのクラブで、どう打ったか</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle
                    className="w-5 h-5 text-sky-700 flex-shrink-0 mt-1"
                    strokeWidth={2}
                  />
                  <span>何が良くて、何が悪かったか</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle
                    className="w-5 h-5 text-sky-700 flex-shrink-0 mt-1"
                    strokeWidth={2}
                  />
                  <span>どの条件で、どんな傾向があったか</span>
                </li>
              </ul>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mb-4 text-justify">
              徹底的に分析し、次に活かしています。
            </p>
            <div className="bg-gradient-to-r from-sky-50 to-slate-50 border-l-4 border-sky-600 p-6 md:p-8 rounded-r-2xl">
              <p className="text-xl font-bold text-sky-700 text-justify">
                彼らが記録するのは、それが最も効率的に上達する方法だと知っているからです。
              </p>
            </div>
          </div>
        </section>

        {/* 従来の記録方法の問題 */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              しかし、従来の記録方法には
              <br />
              大きな問題がありました
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 md:p-7 border-l-4 border-red-500 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle
                  className="w-6 h-6 text-red-600 flex-shrink-0"
                  strokeWidth={2.5}
                />
                <p className="font-bold text-red-800 text-lg">
                  ノートに手書きで記録
                </p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed text-justify">
                時間がかかり、ラウンド後に思い出しながら書くしかない。記憶が曖昧な状態では正確なデータにならない。
              </p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6 md:p-7 border-l-4 border-rose-500 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle
                  className="w-6 h-6 text-rose-600 flex-shrink-0"
                  strokeWidth={2.5}
                />
                <p className="font-bold text-rose-800 text-lg">
                  ラウンド中に詳細をメモ
                </p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed text-justify">
                プレーの流れを妨げ、同伴者にも迷惑がかかる。スロープレーの原因になる。
              </p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6 md:p-7 border-l-4 border-rose-500 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle
                  className="w-6 h-6 text-rose-600 flex-shrink-0"
                  strokeWidth={2.5}
                />
                <p className="font-bold text-rose-800 text-lg">後から思い出す</p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed text-justify">
                既に記憶が曖昧になっており、正確なデータにならない。特に傾斜やライの詳細は思い出せない。
              </p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6 md:p-7 border-l-4 border-rose-500 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle
                  className="w-6 h-6 text-rose-600 flex-shrink-0"
                  strokeWidth={2.5}
                />
                <p className="font-bold text-rose-800 text-lg">
                  データ分析が困難
                </p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed text-justify">
                蓄積したデータを分析するには、膨大な手間がかかる。傾向を掴むのに何時間もかかってしまう。
              </p>
            </div>
          </div>
        </section>

        {/* スマホアプリの登場 */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 rounded-3xl p-8 md:p-10 mb-10 shadow-xl border-2 border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Smartphone className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                スマートフォンアプリが
                <br />
                全てを変えた
              </h2>
            </div>
            <p className="text-lg text-gray-800 leading-relaxed text-justify">
              スマートフォンの登場により、誰でも簡単に、正確に、ラウンド中に記録できるようになりました。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-lg border-2 border-slate-100 hover:border-emerald-300 transition-colors">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Mountain
                  className="text-[var(--color-primary-green)]"
                  size={28}
                  strokeWidth={2.5}
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-lg">
                ジャイロセンサー
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed text-justify">
                傾斜の方向を自動で判別。スマホを地面と平行に持つだけで、わずか数秒で記録完了。
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-lg border-2 border-slate-100 hover:border-sky-300 transition-colors">
              <div className="bg-gradient-to-br from-sky-100 to-sky-200 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Wind className="text-sky-700" size={28} strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-lg">
                位置情報・気象情報
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed text-justify">
                ゴルフ場の位置、気温、風向きを自動で取得。環境データも自動で記録される。
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-lg border-2 border-slate-100 hover:border-violet-300 transition-colors">
              <div className="bg-gradient-to-br from-violet-100 to-violet-200 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Database
                  className="text-violet-700"
                  size={28}
                  strokeWidth={2.5}
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-lg">
                データベース
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed text-justify">
                膨大なデータを瞬時に集計・分析。クラブ別、傾斜別、条件別の傾向が一目で分かる。
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-lg border-2 border-slate-100 hover:border-amber-300 transition-colors">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <BarChart3
                  className="text-amber-700"
                  size={28}
                  strokeWidth={2.5}
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-lg">
                グラフ表示
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed text-justify">
                自分の傾向を視覚的に把握。ショットの分布図や精度の推移で成長が見える。
              </p>
            </div>
          </div>
        </section>

        {/* 何を記録するのか */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              具体的に、何を記録するのか？
            </h2>
            <p className="text-lg text-gray-600">
              記録すべき重要な項目を見ていきましょう
            </p>
          </div>

          {/* 1. 目標までの距離 */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg mb-6 border-2 border-gray-100">
            <h3 className="text-2xl md:text-3xl font-bold text-sky-700 mb-6 flex items-center gap-3">
              <span className="bg-sky-100 text-sky-700 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm">
                1
              </span>
              目標までの距離
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              グリーンまで、あるいはレイアップ地点まで、何ヤードあったのか。
            </p>
            <p className="text-gray-600 text-sm leading-relaxed text-justify">
              距離によって、クラブ選択や打ち方は変わります。この基本情報がなければ、後から分析することができません。
            </p>
          </div>

          {/* 2. 傾斜（最重要） */}
          <div className="bg-gradient-to-br from-amber-50 via-amber-100 to-orange-50 rounded-3xl p-8 md:p-10 shadow-xl mb-6 border-4 border-amber-400">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-amber-900 px-4 py-2 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" strokeWidth={3} />
                  最重要
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="bg-amber-400 text-amber-900 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm">
                    2
                  </span>
                  傾斜
                </h3>
              </div>
            </div>

            <p className="text-xl font-bold text-gray-900 mb-6">
              なぜ傾斜記録が最重要なのか
            </p>

            <div className="bg-white rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <Mountain
                    className="w-6 h-6 text-amber-700 flex-shrink-0 mt-1"
                    strokeWidth={2.5}
                  />
                  <span>
                    <strong>練習場では100%経験できない唯一の要素</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Mountain
                    className="w-6 h-6 text-amber-700 flex-shrink-0 mt-1"
                    strokeWidth={2.5}
                  />
                  <span>
                    <strong>全てのショットが何らかの傾斜から打たれる</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Mountain
                    className="w-6 h-6 text-amber-700 flex-shrink-0 mt-1"
                    strokeWidth={2.5}
                  />
                  <span>
                    <strong>ティーショットでさえ微妙な傾斜がある</strong>
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              練習場は平坦なマットです。しかし、コースで完全に平坦なライなど、ほとんど存在しません。
            </p>
            <p className="text-lg font-bold text-gray-900 text-justify">
              つまり、
              <span className="text-amber-700">
                傾斜への対応力がそのままスコアに直結する
              </span>
              のです。
            </p>

            {/* 8つの傾斜パターン */}
            <div className="mt-6 bg-white rounded-xl p-6">
              <h4 className="font-bold text-gray-900 mb-4">
                8つの傾斜パターン
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-2">
                    基本の4パターン
                  </p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• 左足上がり</li>
                    <li>• 左足下がり</li>
                    <li>• つま先上がり</li>
                    <li>• つま先下がり</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">複合傾斜</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• 左足上がり + つま先上がり</li>
                    <li>• 左足上がり + つま先下がり</li>
                    <li>• 左足下がり + つま先上がり</li>
                    <li>• 左足下がり + つま先下がり</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ジャイロセンサーで簡単記録 */}
            <div className="mt-6 bg-emerald-50 border-2 border-emerald-400 rounded-xl p-6">
              <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <Smartphone size={20} />
                ジャイロセンサーで直感的に記録
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                従来は「左足上がりの傾斜だったような」という曖昧な記憶しか残りませんでしたが、スマートフォンのジャイロセンサーで地面の傾斜を簡単に測定できます。
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                アプリを起動して、スマートフォンを地面と平行に持つだけ。スマートフォン自体がどちらに傾くかで、地面の傾斜方向が自動判定されます。
                <strong>わずか数秒で傾斜方向が記録されます。</strong>
              </p>
            </div>

            {/* 重要な注意 */}
            <div className="mt-6 bg-rose-50 border-l-4 border-rose-400 rounded-r-xl p-6">
              <h4 className="font-bold text-rose-700 mb-3">
                ⚠️ 重要な注意：「一般論」を鵜呑みにしない
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                「左足下がりは飛ばない」「つま先上がりは左に行く」
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                こうした一般論は、確かに物理法則として存在します。しかし、
                <strong className="text-rose-700">
                  あなたの実際の結果は、この一般論通りとは限りません。
                </strong>
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                なぜなら、実際の結果は、物理法則とあなたのスイングの癖が組み合わさって決まるからです。
              </p>
              <div className="bg-white rounded-lg p-4 text-sm text-gray-600">
                <p className="mb-2">
                  •
                  ある人は、左足下がりで低い球が出るが、元々のスイング傾向で右に行くかもしれません。
                </p>
                <p className="mb-2">
                  •
                  ある人は、つま先上がりで左に行きやすいことを意識しすぎて、逆に右を向いて構えてしまうかもしれません。
                </p>
                <p>
                  •
                  ある人は、左足下がりでバランスを崩しやすく、距離が安定しないかもしれません。
                </p>
              </div>
              <p className="text-gray-900 font-bold mt-4">
                一般論は出発点に過ぎず、実際の結果は人それぞれ全く違うのです。雑誌やYouTubeの「一般論」を知った上で、
                <span className="text-rose-700">あなた自身のデータ</span>
                で、あなた固有の傾向を掴むことが重要です。
              </p>
            </div>
          </div>

          {/* 3. ライ */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
            <h3 className="text-2xl font-bold text-sky-700 mb-4 flex items-center gap-2">
              <span className="bg-sky-100 text-sky-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              ライ
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              フェアウェイ、ラフ、ディボット跡、ベアグラウンド、バンカーなど。
            </p>
            <p className="text-gray-600 text-sm mb-4">
              ライの状態は、ショットの難易度を大きく左右します。「フェアウェイから140ヤード」と「深いラフから140ヤード」では、全く別のショットです。
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800">フェアウェイ</p>
                <p className="text-gray-600 text-xs">最も打ちやすい</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800">ラフ</p>
                <p className="text-gray-600 text-xs">距離・方向が不安定</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800">ディボット跡</p>
                <p className="text-gray-600 text-xs">低い球になりやすい</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800">バンカー</p>
                <p className="text-gray-600 text-xs">特殊な技術が必要</p>
              </div>
            </div>
          </div>

          {/* 4. 風向き */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
            <h3 className="text-2xl font-bold text-sky-700 mb-4 flex items-center gap-2">
              <span className="bg-sky-100 text-sky-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              風向き
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              無風、向かい風、追い風、右からの風、左からの風。
            </p>
            <p className="text-gray-600 text-sm">
              風はボールの飛距離と方向に大きな影響を与えます。番手による影響やもち玉による影響が分かれば対策ができます。
            </p>
          </div>

          {/* 5. クラブ選択 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
            <h3 className="text-2xl font-bold text-sky-700 mb-4 flex items-center gap-2">
              <span className="bg-sky-100 text-sky-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                5
              </span>
              クラブ選択
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              どのクラブを選んだのか。
            </p>
            <p className="text-gray-600 text-sm">
              後から見返した時に、「この条件でこのクラブを選んだ」という判断が適切だったかどうかを検証できます。
            </p>
          </div>

          {/* 6. スイングの強さ */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
            <h3 className="text-2xl font-bold text-sky-700 mb-4 flex items-center gap-2">
              <span className="bg-sky-100 text-sky-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                6
              </span>
              スイングの強さ
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              フルスイング、抑えめのスイング、ソフトに打つ、など。
            </p>
            <p className="text-gray-600 text-sm">
              同じクラブでも、スイングの強さによって結果は変わります。「6番アイアンでフルスイング」と「6番アイアンで抑えめのスイング」では、飛距離も精度も異なります。
            </p>
          </div>

          {/* 7. イメージと結果（最も重要） */}
          <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 rounded-3xl p-8 md:p-10 shadow-xl mb-6 border-4 border-slate-300">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="bg-slate-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" strokeWidth={3} />
                  超重要
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="bg-slate-600 text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm">
                    7
                  </span>
                  イメージと結果
                </h3>
              </div>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              ショットを打つ前に、あなたはイメージを作ります。
            </p>

            <div className="bg-white rounded-2xl p-6 md:p-8 mb-6 shadow-sm border-l-4 border-slate-400">
              <p className="text-gray-700 leading-relaxed italic text-lg">
                「このラインで、このくらいの高さで、グリーンセンターに落として、ピンに寄せる」
              </p>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              素振りをしながら、そのイメージを固めます。そして、イメージ通りに体を動かします。
            </p>

            <p className="text-xl font-bold text-slate-700 mb-6">
              その結果、実際にはどうなったのか？
            </p>

            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border-l-4 border-emerald-500">
                <p className="text-gray-700">
                  ✓ イメージ通りにグリーンに乗った
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border-l-4 border-rose-500">
                <p className="text-gray-700">
                  ✗ イメージより右に飛んでバンカーに入った
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border-l-4 border-rose-500">
                <p className="text-gray-700">
                  ✗ イメージより飛ばずに手前のラフに落ちた
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                <p className="text-gray-700">
                  △ イメージ通りの軌道だったが、距離が10ヤード短かった
                </p>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-2xl p-6 md:p-8 shadow-lg">
              <p className="text-lg md:text-xl font-bold mb-3">
                この「想像と現実のギャップ」を記録していくのです
              </p>
              <p className="leading-relaxed text-justify">
                自分の想像（思い込み）と、実際のデータは、驚くほど違います。この違いに気づくことが、上達への第一歩なのです。
              </p>
            </div>
          </div>

          {/* 8. 平均精度とは */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-sky-700 mb-4 flex items-center gap-2">
              <span className="bg-sky-100 text-sky-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                8
              </span>
              「平均精度」とは何か
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              本アプリで頻繁に登場する「平均精度」という指標について、明確に定義しておきます。
            </p>

            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <p className="text-xl font-bold text-gray-900 mb-4">
                平均精度 = 目標地点から実際の着地点までの直線距離の平均値
              </p>
              <p className="text-gray-600 text-sm">
                例えば、グリーンセンターを狙った場合：
              </p>
              <ul className="mt-3 space-y-2 text-gray-700 text-sm">
                <li>• 実際の着地点がピンの右10ヤード → 精度10ヤード</li>
                <li>• 実際の着地点がピンの手前8ヤード → 精度8ヤード</li>
                <li>
                  • 実際の着地点がピンの左12ヤード、奥5ヤード →
                  精度13ヤード（√(12²+5²)）
                </li>
              </ul>
            </div>

            <p className="text-lg font-bold text-gray-900">
              平均精度が小さいほど、目標に正確に打てているということです。
            </p>
            <p className="text-gray-600 mt-3">
              この指標により、各クラブや各条件での「ばらつき」を数値化し、客観的に自分の実力を把握することができます。
            </p>
          </div>
        </section>

        {/* 想像と現実のギャップ */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              想像と現実のギャップが
              <br />
              宝の山
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              考えてみてください。
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-gray-700 leading-relaxed">
                あなたが「狙い通りに打っているつもり」でも、実際のデータを見たら、
                <strong className="text-amber-700">
                  10回中7回は右にずれていた
                </strong>
                としたら？
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-gray-700 leading-relaxed">
                あなたが「フルスイングで150ヤード飛ぶ」と思っているクラブが、ラウンドでは
                <strong className="text-amber-700">
                  平均140ヤードしか飛んでいなかった
                </strong>
                としたら？
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-gray-700 leading-relaxed">
                あなたが「左足下がりは苦手」と思っていたのに、実はデータを見たら
                <strong className="text-amber-700">
                  平均精度が良く、むしろ得意な部類だった
                </strong>
                としたら？
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-2xl p-8 shadow-lg">
            <p className="text-2xl font-bold mb-4">
              自分の想像（思い込み）と、
              <br />
              実際のデータは、驚くほど違います
            </p>
            <p className="text-lg leading-relaxed">
              この違いに気づくことが、上達への第一歩なのです。
            </p>
          </div>
        </section>

        {/* データが貯まると */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            データが貯まれば貯まるほど、
            <br />
            自分が見えてくる
          </h2>

          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            最初のうちは、データが少ないので、明確な傾向は見えないかもしれません。
          </p>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            しかし、ラウンドを重ね、データが蓄積されていくと、驚くほど明確に自分の傾向が見えてきます。
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed text-sm">
                「6番アイアンは、フルスイングだと右に行く傾向が強い」
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed text-sm">
                「左足下がりの傾斜では、いつも距離が10ヤード短くなる」
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed text-sm">
                「グリーンまで残り100ヤード前後のアプローチでは、オーバーしがち」
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
            <p className="text-xl font-bold text-gray-900 mb-4">
              こうした傾向は、感覚では絶対に分かりません
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              正確なデータがあって初めて、客観的に自分を知ることができるのです。
            </p>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-8">
            <p className="text-xl font-bold text-gray-900 mb-4">
              そして、傾向が分かれば、対策が立てられます
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 font-bold mt-1">→</span>
                <span>
                  「6番アイアンは右に行きやすい。練習場で原因を探ろう」
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 font-bold mt-1">→</span>
                <span>「左足下がりでは、1番手大きいクラブを選ぼう」</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 font-bold mt-1">→</span>
                <span>
                  「残り100ヤード前後のアプローチでは、手前から攻める意識で8割ショット」
                </span>
              </li>
            </ul>
            <p className="text-lg font-bold text-emerald-700 mt-6">
              これらは全て、データに基づいた合理的な対策です。
            </p>
          </div>
        </section>

        {/* 記録で得られる3つの力 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            記録することで得られる
            <br />
            3つの力
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <span className="bg-sky-100 text-sky-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                  1
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    客観的に自分を知る力
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    感覚や思い込みではなく、データで自分を知る。これが全ての始まりです。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <span className="bg-emerald-100 text-emerald-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                  2
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    正確な対策を立てる力
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    データに基づいて、何をどう改善すべきかが明確になります。やみくもに練習するのではなく、ピンポイントで弱点を補強できます。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <span className="bg-violet-100 text-violet-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                  3
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    精度を高める力
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    同じ条件に遭遇した時、前回の失敗を繰り返さない。成功パターンを再現する。これにより、確実にショットの精度が向上していきます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* スマホだからこそ可能 */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <Smartphone size={48} />
              <h2 className="text-3xl font-bold">
                スマートフォンだからこそ
                <br />
                可能になったこと
              </h2>
            </div>
            <p className="text-lg leading-relaxed mb-6">
              従来、ここまで詳細な記録を取ることは、プロゴルファーやコーチがついているトップアマにしかできませんでした。
            </p>
            <p className="text-lg leading-relaxed mb-6">
              しかし、スマートフォンの登場により、状況は一変しました。
            </p>
            <div className="bg-white/10 rounded-xl p-6 mb-6">
              <ul className="space-y-3 text-lg">
                <li>✓ ジャイロセンサー - 傾斜の方向を自動で判別</li>
                <li>✓ 位置情報 - ゴルフ場や気温を自動で取得</li>
                <li>✓ データベース - 膨大なデータを瞬時に集計・分析</li>
                <li>✓ グラフ表示 - 自分の傾向を視覚的に把握</li>
              </ul>
            </div>
            <p className="text-xl font-bold">
              これら全てを、ポケットに入るデバイス一つで実現できるのです。
            </p>
            <p className="text-lg mt-4 leading-relaxed">
              しかも、ラウンド中にわずか数秒で記録が完了します。プレーの流れを妨げることなく、正確なデータを蓄積していける。
            </p>
            <p className="text-xl font-bold mt-6 text-emerald-400">
              これは、アマチュアゴルファーにとって革命的なことです。
            </p>
          </div>
        </section>

        {/* まとめ */}
        <section className="mb-12">
          <div className="bg-gray-900 text-white rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6">まとめ</h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p>✓ 記録することで、曖昧な記憶を正確なデータに変えられる</p>
              <p>
                ✓ 傾斜は最も重要な記録項目（練習場では経験できない唯一の要素）
              </p>
              <p>
                ✓
                イメージと結果のギャップを記録することで、自分の思い込みに気づける
              </p>
              <p>✓ データが蓄積されると、自分の傾向が明確に見えてくる</p>
              <p>✓ スマートフォンなら、ラウンド中に簡単に記録できる</p>
              <p>
                ✓
                記録があれば、客観的に自分を知り、正確な対策を立て、精度を高められる
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-16">
          <div className="bg-gradient-to-r from-[var(--color-primary-green)] to-green-700 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              次のラウンドから、
              <br className="sm:hidden" />
              記録を始めましょう
            </h2>
            <p className="text-lg md:text-xl mb-10 leading-relaxed text-justify md:text-center">
              データがあなたのゴルフを変えます。
              <br />
              確実な成長への第一歩を、今すぐ踏み出しましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => openInExternalBrowser('/auth/signup')}
                className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-primary-green)] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                <TrendingUp className="w-5 h-5" />
                アプリをダウンロード
              </button>
              <Link
                href="/learn/growth-cycle"
                className="bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition-colors"
              >
                次：成長サイクル →
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
                <CheckCircle className="w-6 h-6 text-[var(--color-primary-green)]" />
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
