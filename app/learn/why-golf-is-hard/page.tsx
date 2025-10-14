'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Cloud,
  Wind,
  Thermometer,
  Mountain,
  Target,
  Brain,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  BookOpen
} from 'lucide-react';

export default function WhyGolfIsHard() {
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
              深く理解する
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            なぜ、ゴルフは
            <br />
            こんなにも
            <br className="sm:hidden" />
            難しいのか？
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto text-justify md:text-center">
            練習場では上手く打てるのに、コースに出ると全く違う。
            <br />
            その理由を、正確に理解していますか？
          </p>
        </div>

        {/* イントロダクション */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border-2 border-gray-100">
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
              多くのゴルファーが、こんな経験をしています。
            </p>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 md:p-8 mb-6 border-l-4 border-gray-400">
              <p className="text-gray-700 leading-relaxed space-y-2">
                <span className="block">
                  「練習場では7番アイアンで150ヤード、きれいに飛ぶのに」
                </span>
                <span className="block">
                  「コースに出ると、右にも左にも曲がるし、距離も安定しない」
                </span>
                <span className="block">
                  「結局、いつも同じようなスコアで終わってしまう」
                </span>
              </p>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed text-justify">
              なぜ、練習場とコースで、これほど大きな違いが生まれるのでしょうか？実は、ゴルフには
              <strong className="text-[var(--color-primary-green)] text-xl">
                2つの大きな敵
              </strong>
              が存在するのです。
            </p>
          </div>
        </section>

        {/* 敵1: 自然環境 */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-sky-50 via-slate-50 to-blue-50 rounded-3xl p-8 md:p-10 mb-10 shadow-xl border-2 border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Cloud className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                敵その1：自然環境
              </h2>
            </div>
            <p className="text-lg text-gray-800 leading-relaxed text-justify">
              ゴルフは、屋外スポーツです。つまり、<strong>自然環境</strong>
              という、コントロール不可能な要素と常に戦わなければなりません。
            </p>
          </div>

          {/* 傾斜 */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg mb-10 border-2 border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                <Mountain
                  className="w-6 h-6 text-[var(--color-primary-green)]"
                  strokeWidth={2.5}
                />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-primary-green)]">
                傾斜
              </h3>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              練習場のマットは、完全に平坦です。しかし、コースで完全に平坦なライなど、ほとんど存在しません。
            </p>
            <p className="text-gray-700 leading-relaxed mb-8 text-justify">
              ティーグラウンドでさえ、微妙に傾いています。フェアウェイには必ず起伏があり、グリーン周りのアプローチでは、複雑な傾斜に対応しなければなりません。
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 md:p-8 mb-6 border border-slate-200">
              <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--color-primary-green)]" />
                傾斜の種類
              </h4>
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-3">
                    基本の4パターン
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--color-primary-green)] rounded-full"></span>
                      左足上がり
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--color-primary-green)] rounded-full"></span>
                      左足下がり
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--color-primary-green)] rounded-full"></span>
                      つま先上がり
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--color-primary-green)] rounded-full"></span>
                      つま先下がり
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-3">複合傾斜</p>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--color-primary-green)] rounded-full"></span>
                      左足上がり＋つま先上がり
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--color-primary-green)] rounded-full"></span>
                      左足上がり＋つま先下がり
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--color-primary-green)] rounded-full"></span>
                      左足下がり＋つま先上がり
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--color-primary-green)] rounded-full"></span>
                      左足下がり＋つま先下がり
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-6 md:p-8 rounded-r-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1"
                  strokeWidth={2.5}
                />
                <div>
                  <p className="font-bold text-amber-800 mb-2">重要ポイント</p>
                  <p className="text-gray-800 leading-relaxed text-justify">
                    傾斜は、練習場では100%経験できない唯一の要素です。だからこそ、実際のラウンドでどう対応したかを記録し、傾向を掴むことが極めて重要なのです。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ライ */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg mb-10 border-2 border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                <Target
                  className="w-6 h-6 text-[var(--color-primary-green)]"
                  strokeWidth={2.5}
                />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-primary-green)]">
                ライ（芝の状態）
              </h3>
            </div>
            <p className="text-gray-700 leading-relaxed mb-8 text-justify">
              練習場のマットは、常に同じコンディションです。しかし、コースでは、一打一打、全く異なるライから打つことになります。
            </p>

            <div className="space-y-4">
              {[
                {
                  name: "フェアウェイ",
                  desc: "最も打ちやすい状態。しかし、芝の長さや硬さはコースによって異なります。",
                  color: "green",
                },
                {
                  name: "ラフ",
                  desc: "芝が長く、ボールが沈んでいる。フェースが開きやすく、距離も方向も不安定になります。",
                  color: "yellow",
                },
                {
                  name: "ディボット跡",
                  desc: "前の組が削った跡。ボールが低く飛び出し、スピンもかかりにくい。",
                  color: "orange",
                },
                {
                  name: "ベアグラウンド",
                  desc: "芝がなく、地面が露出している。クラブが跳ねやすく、トップしやすい。",
                  color: "red",
                },
                {
                  name: "バンカー",
                  desc: "砂の中。特殊な技術が必要で、距離のコントロールが難しい。",
                  color: "gray",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`bg-${item.color}-50 rounded-xl p-5 border border-${item.color}-200`}
                >
                  <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 bg-${item.color}-500 rounded-full`}
                    ></span>
                    {item.name}
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed text-justify">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 風 */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg mb-10 border-2 border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl">
                <Wind className="w-6 h-6 text-sky-700" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-sky-700">
                風
              </h3>
            </div>
            <p className="text-gray-700 leading-relaxed mb-8 text-justify">
              練習場は、多くの場合、屋内か防風ネットで囲まれています。しかし、コースでは、風の影響を常に受けます。
            </p>
            <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-200">
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <Wind
                    className="w-5 h-5 text-sky-700 flex-shrink-0 mt-1"
                    strokeWidth={2}
                  />
                  <span className="leading-relaxed text-justify">
                    <strong>向かい風</strong>
                    では、ボールが浮き上がり、飛距離が大幅に落ちます。
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Wind
                    className="w-5 h-5 text-sky-700 flex-shrink-0 mt-1"
                    strokeWidth={2}
                  />
                  <span className="leading-relaxed text-justify">
                    <strong>追い風</strong>
                    では、ボールが流され、オーバーしやすくなります。
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Wind
                    className="w-5 h-5 text-sky-700 flex-shrink-0 mt-1"
                    strokeWidth={2}
                  />
                  <span className="leading-relaxed text-justify">
                    <strong>横風</strong>
                    では、ボールが大きく曲がり、狙った方向に飛びません。
                  </span>
                </li>
              </ul>
              <p className="text-gray-600 mt-6 text-sm leading-relaxed text-justify">
                風向きと風速によって、番手を変える必要があります。しかし、どれだけ変えるべきかは、経験とデータがなければ分かりません。
              </p>
            </div>
          </div>

          {/* 気温・湿度 */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border-2 border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl">
                <Thermometer
                  className="w-6 h-6 text-violet-700"
                  strokeWidth={2.5}
                />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-violet-700">
                気温・湿度
              </h3>
            </div>
            <p className="text-gray-700 leading-relaxed mb-8 text-justify">
              意外と見落とされがちですが、気温と湿度も、ボールの飛距離に影響します。
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-6 border border-rose-200">
                <p className="font-bold text-rose-700 mb-3 flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  夏（高温・多湿）
                </p>
                <p className="text-gray-700 text-sm leading-relaxed text-justify">
                  空気抵抗が増え、ボールは飛びにくくなります。ただし体が動きやすいため、スイングスピードは上がります。
                </p>
              </div>
              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-6 border border-sky-200">
                <p className="font-bold text-sky-700 mb-3 flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  冬（低温・乾燥）
                </p>
                <p className="text-gray-700 text-sm leading-relaxed text-justify">
                  空気が薄く、ボールは飛びやすくなります。ただし体が硬くなり、スイングスピードは落ちます。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 敵2: 自分自身 */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-rose-50 via-rose-100 to-pink-50 rounded-3xl p-8 md:p-10 mb-10 shadow-xl border-2 border-rose-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                敵その2：自分自身
              </h2>
            </div>
            <p className="text-lg text-gray-800 leading-relaxed text-justify">
              自然環境と同じくらい、いや、もしかしたらそれ以上に厄介な敵。それは、
              <strong>あなた自身</strong>です。
            </p>
          </div>

          {/* プレッシャー */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg mb-10 border-2 border-slate-100">
            <h3 className="text-2xl md:text-3xl font-bold text-rose-700 mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 bg-rose-100 text-rose-700 rounded-xl font-bold">
                1
              </span>
              プレッシャーと緊張
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              練習場では、失敗しても何も問題ありません。もう一度打てばいいだけです。
            </p>
            <p className="text-gray-700 leading-relaxed mb-8 text-justify">
              しかし、コースでは、<strong>一打一打が本番</strong>
              です。失敗すれば、スコアに直結します。
            </p>
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 md:p-8 border border-rose-200">
              <div className="space-y-3 text-gray-700 mb-6">
                <p className="flex items-start gap-2">
                  <span className="text-rose-600 mt-1">•</span>
                  <span>「右に池がある。絶対に右には打てない」</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-rose-600 mt-1">•</span>
                  <span>「このホール、いつも叩くんだよな」</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-rose-600 mt-1">•</span>
                  <span>「同伴者が見ている。失敗できない」</span>
                </p>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed text-justify">
                こうしたプレッシャーが、体を硬くし、スイングを乱します。練習場では打てるショットが、コースでは打てなくなるのです。
              </p>
            </div>
          </div>

          {/* 判断ミス */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg mb-10 border-2 border-slate-100">
            <h3 className="text-2xl md:text-3xl font-bold text-rose-700 mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 bg-rose-100 text-rose-700 rounded-xl font-bold">
                2
              </span>
              不正確な判断
            </h3>
            <p className="text-gray-700 leading-relaxed mb-8 text-justify">
              練習場では、距離表示があり、同じ距離を繰り返し打てます。しかし、コースでは、毎回異なる距離、異なる条件で判断しなければなりません。
            </p>
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-2xl p-6 border-l-4 border-gray-400">
                <p className="font-bold text-gray-900 mb-3">
                  ❌「7番アイアンは150ヤード飛ぶ」という思い込み
                </p>
                <p className="text-gray-700 text-sm leading-relaxed text-justify">
                  実際には、フェアウェイ、平坦なライ、無風、フルスイングという条件が揃って初めて150ヤード飛ぶのに、どんな条件でも「7番アイアン=150ヤード」と判断してしまう。
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border-l-4 border-gray-400">
                <p className="font-bold text-gray-900 mb-3">
                  ❌「今日は調子が良いから、攻めよう」という感覚的判断
                </p>
                <p className="text-gray-700 text-sm leading-relaxed text-justify">
                  調子が良いと感じるのは、たまたま風が穏やかだったり、フェアウェイが続いただけかもしれません。データがなければ、正確な判断はできません。
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border-l-4 border-gray-400">
                <p className="font-bold text-gray-900 mb-3">
                  ❌「このクラブなら届く気がする」という曖昧な感覚
                </p>
                <p className="text-gray-700 text-sm leading-relaxed text-justify">
                  「気がする」という感覚は、実際のデータと大きく乖離していることがほとんどです。
                </p>
              </div>
            </div>
          </div>

          {/* 無理な攻め */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border-2 border-slate-100">
            <h3 className="text-2xl md:text-3xl font-bold text-rose-700 mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 bg-rose-100 text-rose-700 rounded-xl font-bold">
                3
              </span>
              無理な攻めと力み
            </h3>
            <p className="text-gray-700 leading-relaxed mb-8 text-justify">
              ゴルフには、「攻める場面」と「守る場面」があります。しかし、多くのアマチュアゴルファーは、常に攻めようとします。
            </p>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 md:p-8 mb-6 border border-amber-300">
              <div className="space-y-3 text-gray-700 mb-6">
                <p className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">⚠</span>
                  <span>「残り200ヤード、3番ウッドで狙ってみよう」</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">⚠</span>
                  <span>「深いラフからでも、グリーンを狙う」</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">⚠</span>
                  <span>「池を越えて、ピンに寄せたい」</span>
                </p>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed text-justify">
                こうした無理な攻めは、ミスを誘発します。そして、ミスをした後は、力んで次のショットも失敗する。悪循環に陥るのです。
              </p>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 md:p-8 border border-emerald-300">
              <div className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-[var(--color-primary-green)] flex-shrink-0 mt-1"
                  strokeWidth={2.5}
                />
                <div>
                  <p className="font-bold text-[var(--color-primary-green)] mb-2">
                    データがあれば
                  </p>
                  <p className="text-gray-800 leading-relaxed text-justify">
                    「この条件での自分の平均精度は20ヤード。無理に攻めず、確実にフェアウェイに出そう」と冷静に判断できます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 最大の敵：曖昧な記憶 */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-violet-50 via-violet-100 to-purple-50 rounded-3xl p-8 md:p-10 mb-10 shadow-xl border-2 border-violet-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                  そして、最大の敵
                </h2>
                <p className="text-2xl font-bold text-violet-700 mt-2">
                  曖昧な記憶
                </p>
              </div>
            </div>
            <p className="text-lg text-gray-800 leading-relaxed text-justify">
              自然環境と自分自身。この2つの敵と戦うゴルフにおいて、最も厄介な問題は、「記憶が曖昧すぎる」ということです。
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg mb-10 border-2 border-slate-100">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              ラウンド後、何を覚えていますか？
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              ラウンドが終わった後、友人とこんな会話をしませんか？
            </p>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 md:p-8 mb-8 border-l-4 border-gray-400">
              <div className="space-y-2 text-gray-700">
                <p>💬「今日は調子良かったよ」</p>
                <p>💬「7番ホールで池に入れちゃってさ」</p>
                <p>💬「アプローチが良かったから、パーが取れた」</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mb-8 text-justify">
              一見、ラウンドを振り返っているように見えます。しかし、これらは全て
              <strong className="text-purple-600">「感覚的な印象」</strong>
              であって、<strong>正確な記録</strong>ではありません。
            </p>

            <div className="bg-violet-50 border-l-4 border-violet-500 p-6 md:p-8 rounded-r-2xl mb-8">
              <p className="font-bold text-gray-900 mb-4 text-lg">
                🤔 試しに、思い出してみてください
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-violet-700 mt-1">•</span>
                  <span>7番アイアンで何回打ちましたか？</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-700 mt-1">•</span>
                  <span>そのうち、何回グリーンに乗りましたか？</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-700 mt-1">•</span>
                  <span>左足下がりの傾斜から、何回打ちましたか？</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-700 mt-1">•</span>
                  <span>そのとき、どのクラブを選びましたか？</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-700 mt-1">•</span>
                  <span>結果は、狙い通りでしたか？</span>
                </li>
              </ul>
            </div>

            <p className="text-xl font-bold text-gray-900 mb-4">
              おそらく、正確には答えられないはずです。
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              これが、記憶の限界です。人間の記憶は、驚くほど曖昧で、不正確なのです。
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg mb-10 border-2 border-slate-100">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              記憶が曖昧だと、何が起こるか
            </h3>

            <div className="space-y-6">
              {[
                {
                  number: "1",
                  title: "同じミスを繰り返す",
                  desc: "前回、このホールで右のバンカーに入れたのに、今回も同じクラブで同じように打ってしまう。なぜなら、前回の詳細を覚えていないからです。",
                },
                {
                  number: "2",
                  title: "成長の実感が得られない",
                  desc: "「なんとなく上手くなった気がする」という感覚はあっても、具体的に何が改善されたのか分からない。だから、モチベーションが続きません。",
                },
                {
                  number: "3",
                  title: "練習の方向性が定まらない",
                  desc: "「苦手なクラブを練習しよう」と思っても、実際にどのクラブが苦手なのか、データがなければ分かりません。感覚だけでは、正しい練習ができないのです。",
                },
                {
                  number: "4",
                  title: "条件別の対策が立てられない",
                  desc: "「左足下がりでは、どう打てばいいのか」を学ぶには、何度も経験し、その結果を記録する必要があります。記憶だけでは、正確な傾向は掴めません。",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 md:p-8 border border-rose-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-rose-100 text-rose-700 rounded-xl font-bold text-lg flex-shrink-0">
                      {item.number}
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-700 mb-3 text-lg">
                        {item.title}
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-justify">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <TrendingUp className="w-12 h-12 text-white" strokeWidth={2.5} />
              <h3 className="text-2xl md:text-3xl font-bold">
                だからこそ、記録が必要なのです
              </h3>
            </div>
            <p className="text-lg md:text-xl leading-relaxed mb-6">
              曖昧な記憶を、正確なデータに変える。
              <br />
              感覚的な印象を、客観的な事実に変える。
            </p>
            <p className="text-lg md:text-xl leading-relaxed mb-6">
              それが、記録の力です。
            </p>
            <p className="text-xl font-bold">
              記録があれば、自然環境と自分自身という2つの敵に、データという武器で立ち向かうことができるのです。
            </p>
          </div>
        </section>

        {/* まとめ */}
        <section className="mb-16">
          <div className="bg-gray-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3">
              <CheckCircle className="w-8 h-8" strokeWidth={2.5} />
              まとめ
            </h2>
            <div className="space-y-5 text-base md:text-lg leading-relaxed">
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>
                  ゴルフには、<strong>自然環境</strong>と
                  <strong>自分自身</strong>という2つの敵がいる
                </span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>
                  練習場では経験できない条件（傾斜、ライ、風など）が、コースでは常に変化する
                </span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>
                  プレッシャー、判断ミス、無理な攻めが、スコアを悪化させる
                </span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>
                  最大の問題は、<strong>記憶が曖昧すぎる</strong>こと
                </span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-400 text-2xl flex-shrink-0">✓</span>
                <span>
                  記録があれば、曖昧な記憶を正確なデータに変え、確実に成長できる
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-16">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              記録で、
              <br className="sm:hidden" />
              ゴルフが変わる
            </h2>
            <p className="text-lg md:text-xl mb-10 leading-relaxed text-justify md:text-center">
              次のラウンドから、全てのショットを記録しましょう。
              <br />
              データがあなたの武器になります。
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
                href="/learn/why-recording"
                className="inline-flex items-center justify-center gap-2 bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition-colors"
              >
                次：なぜ記録が重要か →
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
                  なぜ記録が重要か
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-justify">
                何を記録し、どう活用するのか。記録の具体的な方法を解説します。
              </p>
            </Link>
            <Link
              href="/learn/growth-cycle"
              className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100 hover:border-[var(--color-primary-green)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6 text-[var(--color-primary-green)]" />
                <h4 className="font-bold text-gray-900 text-lg">
                  成長サイクル
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
