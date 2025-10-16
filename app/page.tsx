'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import {
  Cloud,
  Wind,
  Target,
  Brain,
  Info,
  Flag,
  LineChart,
  FileText
} from 'lucide-react';
import SlopeSelectionDemo from '@/components/SlopeSelectionDemo';
import ShotPatternDemo from '@/components/ShotPatternDemo';
import WorstClubsDemo from '@/components/WorstClubsDemo';
import { useExternalBrowser } from '@/hooks/useExternalBrowser';

/**
 * メインランディングページ - 上手くなる気がするぅぅぅ
 * Kindle本の内容を完全に反映した本格的LP
 */
export default function LandingPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // 外部ブラウザで開くフック
  const { openInExternalBrowser } = useExternalBrowser();

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    // メールアドレスの半角英数字チェック
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(contactForm.email)) {
      setSubmitError('メールアドレスは半角英数字で入力してください');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setSubmitError(data.error || '送信に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setSubmitError('送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ヒーローセクション */}
      <section className="relative h-screen flex items-center justify-center text-center overflow-hidden bg-gradient-to-b from-green-50 to-white">
        {/* 背景画像 */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/landing/images/hero-background.webp"
            alt="Hero background"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
        </div>

        {/* 左側の男性画像 - PC表示のみ */}
        <div className="hidden lg:block absolute left-0 bottom-0 z-10 w-1/4 h-auto pointer-events-none">
          <Image
            src="/landing/images/left_man.png"
            alt="Golf player"
            width={400}
            height={600}
            className="object-contain object-bottom w-full h-auto"
            priority
          />
        </div>

        {/* 右側の女性画像 - PC表示のみ */}
        <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-1/4 h-auto pointer-events-none">
          <Image
            src="/landing/images/right_woman.png"
            alt="Golf player"
            width={400}
            height={600}
            className="object-contain object-bottom w-full h-auto"
            priority
          />
        </div>

        {/* コンテンツ */}
        <div className="relative z-20 max-w-5xl mx-auto px-6 py-8 lg:py-20">
          {/* 白いぼかし背景 */}
          <div className="absolute inset-x-4 inset-y-0 lg:inset-0 bg-white/60 backdrop-blur-sm rounded-3xl -z-10"></div>
          <div className="inline-block mb-4 lg:mb-6 px-4 lg:px-6 py-1.5 lg:py-2 bg-green-100 border border-green-200 rounded-full">
            <span className="text-[var(--color-primary-green)] text-xs lg:text-sm font-medium tracking-wide">
              データ主導型ゴルフ上達アプリ
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-4 lg:mb-8 leading-tight">
            なぜ、練習しても
            <br />
            上手くならないのか？
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-800 mb-3 lg:mb-6 font-medium">
            答えは、
            <span className="highlight-text">
              「曖昧な記憶」に頼っているから。
            </span>
          </p>

          <p className="text-sm sm:text-base md:text-lg text-gray-800 mb-6 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
            練習場で何百球打っても、ラウンドで同じミスを繰り返す。
            <br className="hidden md:block" />
            それは、あなたの「思い込み」と「実際の結果」のギャップに気づいていないから。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 mx-4 sm:mx-0">
            <a
              href="#why-hard"
              className="px-10 py-5 bg-white border-2 border-green-600 text-green-600 text-xl font-bold rounded-xl hover:bg-green-50 transition-all"
            >
              詳しく見る
            </a>
          </div>

          <p className="text-xs sm:text-sm text-gray-600">
            ※クレジットカード登録不要で今すぐお試しいただけます
          </p>
        </div>

        <div className="absolute bottom-4 lg:bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
          <div className="w-8 h-12 border-2 border-white rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* 中間CTA セクション #1 */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-green)] via-[var(--color-primary-dark)] to-green-900"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">
            自然を味方につける
            <br className="sm:hidden" />
            ゴルフを始めよう
          </h2>
          <p className="text-lg text-white/90 mb-10">
            風や傾斜を読み、コースを攻略する楽しさを体験してください
          </p>

          <button
            onClick={() => openInExternalBrowser('/auth/signup')}
            className="group px-12 py-5 bg-white text-[var(--color-primary-green)] text-lg font-bold rounded-xl hover:bg-gray-50 transition-all shadow-2xl hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              3ラウンド無料で始める
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </button>

          <p className="text-sm text-white/70 mt-6">クレジットカード登録不要</p>
        </div>
      </section>

      {/* 問題提起セクション - ゴルフの本当の難しさ */}
      <section
        id="why-hard"
        className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-100"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-blue-100 rounded-full">
              <span className="text-blue-800 text-sm font-semibold tracking-wide">
                問題提起
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              ゴルフはなぜ、
              <br className="sm:hidden" />
              これほど難しいのか
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-justify">
              真面目に練習を重ね、レッスンにも通い、スイングフォームも改善した。なのに、スコアは思うように伸びない。その理由は明確です。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-16">
            {/* 敵その1 */}
            <div className="group bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-300">
              <div className="w-20 h-20 mb-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <div className="relative">
                  <Cloud className="w-9 h-9 text-white" strokeWidth={2} />
                  <Wind
                    className="w-5 h-5 text-white absolute -bottom-1 -right-1"
                    strokeWidth={2.5}
                  />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">
                敵その1：自然環境
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4 text-justify">
                傾斜、ライ、風、気温、天候、芝の状態...これらの要素は刻一刻と変化し、複合的に絡み合います。
              </p>
              <p className="text-gray-800 font-semibold text-lg">
                練習場では100%経験できない、予測不可能な敵です。
              </p>
            </div>

            {/* 敵その2 */}
            <div className="group bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-orange-300">
              <div className="w-20 h-20 mb-6 bg-gradient-to-br from-orange-500 to-orange-700 rounded-3xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Target className="w-9 h-9 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">
                敵その2：自分自身
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4 text-justify">
                無理なショットを狙ってしまう。プレッシャーがかかると固くなる。前のミスを挽回しようと焦る。
              </p>
              <p className="text-gray-800 font-semibold text-lg">
                自分の心が作り出す、最も厄介な敵です。
              </p>
            </div>
          </div>

          {/* 記憶の問題 */}
          <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-l-8 border-red-500 p-10 rounded-r-3xl mb-12 shadow-lg">
            <h4 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Brain
                className="w-10 h-10 md:w-12 md:h-12 text-red-600 flex-shrink-0"
                strokeWidth={2}
              />
              さらに問題なのは、記憶はあてにならない
            </h4>
            <p className="text-gray-700 text-lg leading-relaxed mb-5 text-justify">
              「7番ホールのティーショット、どこ行った？」「えーっと、右のラフ...だったかな？」
            </p>
            <p className="text-gray-700 text-lg leading-relaxed text-justify">
              ラウンド中は、あまりにも多くのことを考えながらプレーしています。一打一打の詳細を正確に記憶するなど、不可能に近いのです。
            </p>
          </div>

          <div className="text-left md:text-center">
            <Link
              href="/learn/why-golf-is-hard"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[var(--color-primary-green)] text-white text-xl font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              ゴルフが難しい本当の理由を詳しく読む
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* なぜ記録なのか */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-green-100 rounded-full">
              <span className="text-green-800 text-sm font-semibold tracking-wide">
                ソリューション
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              データがあれば、
              <br className="sm:hidden" />
              対策が立てられる
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-justify">
              曖昧な記憶に基づいて、曖昧な対策しか立てていない。これでは、安定したショットなど打てるはずがありません。しかし、正確なデータさえあれば、確実に成長できます。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 mb-16">
            {/* 傾向が見える */}
            <div className="group text-center bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-300 hover:-translate-y-2">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="text-4xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-5">
                自分の傾向が見える
              </h3>
              <p className="text-gray-600 leading-relaxed text-justify">
                5番アイアンは、いつも右に行く傾向がある。つま先下がりのラフは左に行くことが多い。
              </p>
            </div>

            {/* 対策が立てられる */}
            <div className="group text-center bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-green-300 hover:-translate-y-2">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-700 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="text-4xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-5">
                具体的な対策が立てられる
              </h3>
              <p className="text-gray-600 leading-relaxed text-justify">
                5番アイアンは右に行きやすい。練習場で原因を探ろう。基礎練習を増やそう。
              </p>
            </div>

            {/* 精度が上がる */}
            <div className="group text-center bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-orange-300 hover:-translate-y-2">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-orange-700 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="text-4xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-5">
                ショットの精度が向上
              </h3>
              <p className="text-gray-600 leading-relaxed text-justify">
                対策が立てられれば、精度が上がる。精度が上がれば、スコアが良くなる。
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-l-8 border-blue-600 p-10 rounded-r-3xl mb-12 shadow-lg">
            <h4 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              これこそが、練習とラウンドを繋ぐ、データの力です
            </h4>
            <p className="text-gray-700 text-lg leading-relaxed text-justify">
              練習場での練習も、「目的を持ったもの」に変わります。苦手なクラブを集中的に練習する。なぜそのクラブの精度が悪いのか、原因を追求する。基本に立ち返り、正しいスイングを反復練習する。
            </p>
          </div>

          <div className="text-left md:text-center">
            <Link
              href="/learn/why-recording"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[var(--color-primary-green)] text-white text-xl font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              記録がもたらす革命を詳しく読む
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* このアプリの価値 */}
      <section
        id="features"
        className="py-24 bg-gradient-to-br from-purple-50 via-white to-pink-50"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-purple-100 rounded-full">
              <span className="text-purple-800 text-sm font-semibold tracking-wide">
                3つの価値
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              このアプリが提供する
              <br className="sm:hidden" />
              3つの価値
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              スマートフォンだからこそ実現できる、本格的なデータ分析
            </p>
          </div>

          <div className="space-y-32">
            {/* 特徴1：実際の着地点を記録 */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div
                  className="relative rounded-3xl overflow-hidden shadow-2xl p-8"
                  style={{ background: "var(--color-bg-main)" }}
                >
                  {/* 実際のアプリのショットパターンUI */}
                  <ShotPatternDemo />
                </div>
              </div>

              <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-50 rounded-full mb-6">
                  <span className="text-blue-600 font-bold text-sm">VALUE</span>
                  <span className="text-2xl font-bold text-blue-600">01</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                  想像と現実のギャップが宝の山
                </h3>

                <p className="text-xl text-gray-700 mb-6 leading-relaxed text-justify">
                  「狙い通りに打っているつもり」でも、実際のデータを見たら、10回中7回は右にずれていた。
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-8 border-blue-600 p-8 rounded-r-3xl mb-6 shadow-md">
                  <p className="text-gray-700 text-lg leading-relaxed text-justify">
                    自分の想像（思い込み）と、実際のデータは、驚くほど違います。この違いに気づくことが、上達への第一歩なのです。
                  </p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700">
                      目標地点から実際の着地点までのズレを記録
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700">
                      クラブ別の平均精度を自動計算
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700">
                      ワースト5クラブを自動表示
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 特徴2：条件を記録 */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="lg:w-1/2">
                <div
                  className="relative rounded-3xl overflow-hidden shadow-2xl px-4 py-8 sm:p-8"
                  style={{ background: "var(--color-bg-main)" }}
                >
                  {/* 実際のアプリの傾斜選択UI */}
                  <SlopeSelectionDemo />
                </div>
              </div>

              <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-green-50 rounded-full mb-6">
                  <span className="text-green-600 font-bold text-sm">
                    VALUE
                  </span>
                  <span className="text-2xl font-bold text-green-600">02</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                  傾斜こそが最重要データ
                </h3>

                <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                  練習場では100%経験できない唯一の要素。それが傾斜です。
                </p>

                <div className="bg-gray-50 border-l-4 border-green-500 p-6 rounded-r-xl mb-6">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    コースで完全に平坦なライなど、ほとんど存在しません。つまり、傾斜への対応力がそのままスコアに直結するのです。
                  </p>
                  <p className="text-gray-700 font-semibold">
                    ジャイロセンサーで地面の傾斜を自動判別。わずか数秒で記録完了。
                  </p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700">
                      8つの傾斜パターンを自動判別
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700">
                      ライ、風向き、気温も記録
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700">
                      条件別の精度を自動分析
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 特徴3：成長サイクル */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <WorstClubsDemo />
              </div>

              <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-orange-50 rounded-full mb-6">
                  <span className="text-orange-600 font-bold text-sm">
                    VALUE
                  </span>
                  <span className="text-2xl font-bold text-orange-600">03</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                  練習とラウンドの両輪
                </h3>

                <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                  データに基づいた練習と、ラウンドでの実践。この両輪を回すことで、着実に上達します。
                </p>

                <div className="bg-gray-50 border-l-4 border-orange-500 p-6 rounded-r-xl mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    ラウンドのデータが練習場で「何を練習すべきか」を教えてくれる。練習場で磨いた技術を、次のラウンドで試す。そして、データで改善を確認する。
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      1
                    </div>
                    <p className="text-gray-700">ラウンドでデータを記録</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      2
                    </div>
                    <p className="text-gray-700">弱点・傾向が見える</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      3
                    </div>
                    <p className="text-gray-700">練習場で集中練習</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      4
                    </div>
                    <p className="text-gray-700">次のラウンドで改善を確認</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-left md:text-center mt-16">
            <Link
              href="/learn/growth-cycle"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[var(--color-primary-green)] text-white text-xl font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              確実な成長サイクルを詳しく読む
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 誰に効果があるのか */}
      <section className="py-24 bg-gradient-to-br from-green-50 via-white to-yellow-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-yellow-100 rounded-full">
              <span className="text-yellow-900 text-sm font-semibold tracking-wide">
                対象ユーザー
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              このアプリが
              <br className="sm:hidden" />
              最も効果的な人
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-justify md:text-center">
              誰にでも効果があるわけではありません。正直に、現実的な期待値をお伝えします。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* 効果的な人 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-10">
              <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-3">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                こんな方に最適
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">
                      平均スコア90-110のアマチュアゴルファー
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      基本的なスイングはできるが、コースマネジメントが甘い
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">
                      データ分析に興味がある人
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      数値で自分を客観的に見ることに抵抗がない
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">
                      練習する意欲がある人
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      データで弱点が分かった後、練習場で改善に取り組める
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">
                      継続的に記録する習慣がつく人
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      最低でも3-5ラウンド、できれば10ラウンド以上継続できる
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* 効果が限定的な人 */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                効果が限定的な方
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">全くの初心者</p>
                    <p className="text-sm text-gray-700 mt-1">
                      ボールにまともに当たらないレベルでは、まず基礎練習が必要
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      練習する時間がない人
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      データで弱点が分かっても、練習しなければ改善しない
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      記録を継続できない人
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      1-2回記録しただけでは傾向は見えない
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      「アプリを入れただけで上手くなる」と考える人
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      データは問題を教えるだけ。解決には練習が必要
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-8 rounded-r-2xl">
            <h4 className="text-xl font-bold text-gray-800 mb-4">
              このアプリは魔法ではありません
            </h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              データは「何が問題か」を教えてくれます。しかし、解決するには「練習」と「継続」が必要です。
            </p>
            <p className="text-gray-700 leading-relaxed font-semibold">
              両方を実行できる人には、確実に効果があります。
            </p>
          </div>

          <div className="text-left md:text-center mt-12">
            <Link
              href="/learn/realistic-expectations"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[var(--color-primary-green)] text-white text-xl font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              現実的な期待値を詳しく読む
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 現実的な期待値 */}
      <section className="py-24 bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-orange-100 rounded-full">
              <span className="text-orange-800 text-sm font-semibold tracking-wide">
                期待値
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              3ヶ月〜半年で、
              <br className="sm:hidden" />
              どれくらい上達するか
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-justify md:text-center">
              正直に、現実的な期待値をお伝えします
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* 期待できる効果 */}
            <div className="bg-white rounded-3xl p-10 shadow-xl border-2 border-green-200 hover:shadow-2xl hover:border-green-300 transition-all duration-300">
              <h3 className="text-2xl md:text-3xl font-bold text-green-600 mb-6 flex items-center gap-3">
                <svg
                  className="w-10 h-10 transform hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                期待できる効果
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                  <p className="text-gray-700">
                    苦手クラブが明確になり、練習の優先順位がつく
                  </p>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                  <p className="text-gray-700">同じミスを繰り返す頻度が減る</p>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                  <p className="text-gray-700">
                    コースマネジメントが改善され、無理な攻めが減る
                  </p>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                  <p className="text-gray-700 font-bold">
                    → 平均3-7打のスコア改善（個人差あり）
                  </p>
                </li>
              </ul>
            </div>

            {/* 期待できない効果 */}
            <div className="bg-white rounded-3xl p-10 shadow-xl border-2 border-orange-200 hover:shadow-2xl hover:border-orange-300 transition-all duration-300">
              <h3 className="text-2xl md:text-3xl font-bold text-orange-600 mb-6 flex items-center gap-3">
                <svg
                  className="w-10 h-10 transform hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                期待できない効果
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                  <p className="text-gray-700">
                    スイング自体が劇的に美しくなる
                  </p>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                  <p className="text-gray-700">飛距離が大幅に伸びる</p>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                  <p className="text-gray-700">一瞬で上級者になる</p>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                  <p className="text-gray-700 font-bold">
                    → これらは、アプリでは解決できません
                  </p>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-10 shadow-2xl border-2 border-[var(--color-primary-green)] mb-12 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] transition-all duration-300">
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 text-center">
              スコアアップに必要な
              <br className="sm:hidden" />
              3つの条件
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-[var(--color-primary-green)] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg hover:scale-110 transition-transform">
                  1
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">
                  基本的なスイング技術
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  平均スコア100-120程度で、ある程度安定してボールに当たる
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-[var(--color-primary-green)] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg hover:scale-110 transition-transform">
                  2
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">
                  練習する意欲
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  データで弱点が分かった後、練習場で基礎練習をする
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-[var(--color-primary-green)] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg hover:scale-110 transition-transform">
                  3
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">
                  継続的な記録
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  最低でも3-5ラウンド、できれば10ラウンド以上継続
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 中間CTA セクション #2 */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-green)] via-[var(--color-primary-dark)] to-green-900"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">
            データが教えてくれる、
            <br className="sm:hidden" />
            新しいゴルフ
          </h2>
          <p className="text-lg text-white/90 mb-10">
            記録し続けることで、あなたの真の実力が見えてきます
          </p>

          <button
            onClick={() => openInExternalBrowser('/auth/signup')}
            className="group px-12 py-5 bg-white text-[var(--color-primary-green)] text-lg font-bold rounded-xl hover:bg-gray-50 transition-all shadow-2xl hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              3ラウンド無料で始める
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </button>

          <p className="text-sm text-white/70 mt-6">クレジットカード登録不要</p>
        </div>
      </section>

      {/* 成長のロードマップ */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-indigo-100 rounded-full">
              <span className="text-indigo-800 text-sm font-semibold tracking-wide">
                ロードマップ
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              3ヶ月で、あなたの
              <br className="sm:hidden" />
              ゴルフが変わる
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-justify md:text-center">
              データ蓄積から上達まで、段階的な成長ロードマップ
            </p>
          </div>

          <div className="space-y-8">
            {/* フェーズ1 */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 hover:-translate-y-2 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-full sm:w-28 h-16 sm:h-28 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full sm:rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 sm:hover:rotate-3 transition-all">
                  <span className="text-white text-sm sm:text-sm font-bold whitespace-nowrap">
                    <span className="sm:hidden">1-3ラウンド</span>
                    <span className="hidden sm:inline">
                      1-3
                      <br />
                      ラウンド
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-3xl p-6 sm:p-10 shadow-xl border-2 border-blue-200">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-4">
                  初期段階：データ蓄積フェーズ
                </h3>
                <p className="text-gray-700 leading-relaxed mb-6 text-justify">
                  まずはデータを貯めることを優先。データ数が少ないため、あくまで「参考値」として扱います。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-2">やること</p>
                    <p className="text-sm text-gray-600">
                      記録に慣れる。一打一打を正確に記録する習慣をつける。
                    </p>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-2">
                      わかること
                    </p>
                    <p className="text-sm text-gray-600">
                      「このクラブ、もしかしたら右に行きやすいかも」という仮説
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* フェーズ2 */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 hover:-translate-y-2 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-full sm:w-28 h-16 sm:h-28 bg-gradient-to-br from-green-500 to-green-600 rounded-full sm:rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 sm:hover:rotate-3 transition-all">
                  <span className="text-white text-sm sm:text-sm font-bold whitespace-nowrap">
                    <span className="sm:hidden">4-10ラウンド</span>
                    <span className="hidden sm:inline">
                      4-10
                      <br />
                      ラウンド
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-r from-green-50 to-green-100 rounded-3xl p-6 sm:p-10 shadow-xl border-2 border-green-200">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-4">
                  中期段階：傾向発見フェーズ
                </h3>
                <p className="text-gray-700 leading-relaxed mb-6 text-justify">
                  各クラブで10〜30回程度のデータが貯まり、大まかな傾向が見え始めます。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-2">やること</p>
                    <p className="text-sm text-gray-600">
                      ワースト5クラブを集中的に練習。原因を追求し、基本を見直す。
                    </p>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-2">
                      わかること
                    </p>
                    <p className="text-sm text-gray-600">
                      「このクラブは右に行く傾向がある」と確信を持てる
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* フェーズ3 */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 hover:-translate-y-2 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-full sm:w-28 h-16 sm:h-28 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full sm:rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 sm:hover:rotate-3 transition-all">
                  <span className="text-white text-sm sm:text-sm font-bold whitespace-nowrap">
                    <span className="sm:hidden">11+ラウンド</span>
                    <span className="hidden sm:inline">
                      11+
                      <br />
                      ラウンド
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-r from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10 shadow-xl border-2 border-orange-200">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-4">
                  長期段階：攻略完了フェーズ
                </h3>
                <p className="text-gray-700 leading-relaxed mb-6 text-justify">
                  各クラブで30回以上のデータが貯まり、統計的に信頼性の高い傾向として活用できます。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-2">やること</p>
                    <p className="text-sm text-gray-600">
                      条件別の詳細な分析。確信を持って戦略に組み込む。
                    </p>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-2">
                      わかること
                    </p>
                    <p className="text-sm text-gray-600">
                      「この条件では、こう打つべき」という実践知
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-purple-50 to-purple-100 border-l-8 border-purple-500 p-10 rounded-r-3xl shadow-2xl">
            <h4 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-4">
              月1回ラウンドする場合、約3ヶ月で中期段階に到達
            </h4>
            <p className="text-gray-700 leading-relaxed text-justify">
              限られた実践機会でも、正確に記録し、データを活用すれば、確実に成長できます。これが、アマチュアゴルファーがプロに近づくための、最も現実的な方法です。
            </p>
          </div>
        </div>
      </section>

      {/* 従来のアプリとの違い */}
      <section className="py-24 bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-teal-100 rounded-full">
              <span className="text-teal-800 text-sm font-semibold tracking-wide">
                比 較
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              スイング分析でも、
              <br />
              スコア管理でもない
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-justify md:text-center">
              実戦での「本当の結果」にフォーカスした、唯一のアプリ
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-200 hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-primary-dark)] text-white">
                  <tr>
                    <th className="px-3 py-4 sm:px-8 sm:py-6 text-left font-extrabold text-sm sm:text-lg">
                      項目
                    </th>
                    <th className="px-3 py-4 sm:px-8 sm:py-6 text-left font-extrabold text-sm sm:text-lg">
                      従来のアプリ
                    </th>
                    <th className="px-3 py-4 sm:px-8 sm:py-6 text-left font-extrabold text-sm sm:text-lg">
                      上手くなる気がするぅぅぅ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition-all duration-200">
                    <td className="px-3 py-4 sm:px-8 sm:py-6 font-bold text-gray-900 text-xs sm:text-base">
                      記録するもの
                    </td>
                    <td className="px-3 py-4 sm:px-8 sm:py-6 text-gray-600 text-xs sm:text-base">
                      スイング軌道の分析
                    </td>
                    <td className="px-3 py-4 sm:px-8 sm:py-6 font-extrabold text-[var(--color-primary-green)] text-xs sm:text-base">
                      ✓ 実際の着地点を記録
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-all duration-200 bg-gray-50/50">
                    <td className="px-3 py-4 sm:px-8 sm:py-6 font-bold text-gray-900 text-xs sm:text-base">
                      目的
                    </td>
                    <td className="px-3 py-4 sm:px-8 sm:py-6 text-gray-600 text-xs sm:text-base">
                      スコアの記録・管理
                    </td>
                    <td className="px-3 py-4 sm:px-8 sm:py-6 font-extrabold text-[var(--color-primary-green)] text-xs sm:text-base">
                      ✓ ショットの精度を可視化
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-all duration-200">
                    <td className="px-3 py-4 sm:px-8 sm:py-6 font-bold text-gray-900 text-xs sm:text-base">
                      アプローチ
                    </td>
                    <td className="px-3 py-4 sm:px-8 sm:py-6 text-gray-600 text-xs sm:text-base">
                      理想のフォームを目指す
                    </td>
                    <td className="px-3 py-4 sm:px-8 sm:py-6 font-extrabold text-[var(--color-primary-green)] text-xs sm:text-base">
                      ✓ 自分の傾向を知り、対応力を磨く
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-green-50 to-green-100 border-l-8 border-[var(--color-primary-green)] p-10 rounded-r-3xl shadow-2xl">
            <p className="text-lg md:text-xl text-gray-800 font-bold mb-4 leading-relaxed text-justify">
              「練習場でのスイングがどんなに綺麗でも、コースで結果が出なければ意味がない。」
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              上手くなる気がするぅぅぅは、実戦での「本当の結果」にフォーカスした、実践型ゴルフアプリです。
            </p>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="py-24 bg-gradient-to-br from-emerald-50 via-white to-lime-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-emerald-100 rounded-full">
              <span className="text-emerald-800 text-sm font-semibold tracking-wide">
                使い方
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              シンプルな3ステップで
              <br className="sm:hidden" />
              すぐに始められる
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-justify md:text-center">
              面倒な設定は不要。ラウンド中にサッと記録できます
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* ステップ1 */}
            <div className="relative text-center group">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all">
                <span className="text-5xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                <Flag
                  className="w-7 h-7 text-[var(--color-primary-green)]"
                  strokeWidth={2}
                />
                ショットを打つ
              </h3>
              <p className="text-gray-600 leading-relaxed">
                いつも通りラウンド。ショットを打ったら、アプリを開く。
              </p>
            </div>

            {/* ステップ2 */}
            <div className="relative text-center group">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-100 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all">
                <span className="text-5xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                <FileText
                  className="w-7 h-7 text-[var(--color-primary-green)]"
                  strokeWidth={2}
                />
                結果を記録
              </h3>
              <p className="text-gray-600 leading-relaxed">
                着地点をタップ。傾斜や風などの条件も簡単入力。
              </p>
            </div>

            {/* ステップ3 */}
            <div className="relative text-center group">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-100 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all">
                <span className="text-5xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                <LineChart
                  className="w-7 h-7 text-[var(--color-primary-green)]"
                  strokeWidth={2}
                />
                データで確認
              </h3>
              <p className="text-gray-600 leading-relaxed">
                クラブ別の傾向、条件別の精度が自動で分析される。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 中間CTA セクション #3 */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-green)] via-[var(--color-primary-dark)] to-green-900"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">
            3ステップで始める、
            <br className="sm:hidden" />
            新しいゴルフ体験
          </h2>
          <p className="text-lg text-white/90 mb-10">
            ショット、記録、分析。シンプルな流れで上達を実感できます
          </p>

          <button
            onClick={() => openInExternalBrowser('/auth/signup')}
            className="group px-12 py-5 bg-white text-[var(--color-primary-green)] text-lg font-bold rounded-xl hover:bg-gray-50 transition-all shadow-2xl hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              3ラウンド無料で試してみる
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </button>

          <p className="text-sm text-white/70 mt-6">クレジットカード登録不要</p>
        </div>
      </section>

      {/* 料金プラン */}
      <section className="py-24 bg-gradient-to-br from-amber-50 via-white to-yellow-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-amber-100 rounded-full">
              <span className="text-amber-800 text-sm font-semibold tracking-wide">
                料金プラン
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              まずは無料で試せます
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-justify md:text-center">
              3ラウンド分のデータを記録して、効果を実感してください
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* 月額プラン */}
            <div className="bg-white rounded-3xl shadow-xl p-10 border-2 border-gray-200 hover:border-[var(--color-primary-green)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 bg-gray-100 rounded-full mb-4">
                  <span className="text-sm font-bold text-gray-600">
                    MONTHLY
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  月額プラン
                </h3>
                <div className="flex items-end justify-center gap-2">
                  <span className="text-6xl font-extrabold text-[var(--color-primary-green)]">
                    ¥550
                  </span>
                  <span className="text-gray-500 pb-3 text-lg">/月</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-[var(--color-primary-green)]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">無制限のショット記録</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-[var(--color-primary-green)]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">全ての分析機能</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-[var(--color-primary-green)]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">データのエクスポート</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-[var(--color-primary-green)]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">いつでもキャンセル可能</span>
                </li>
              </ul>

              <button
                onClick={() => openInExternalBrowser('/auth/signup')}
                className="w-full py-4 bg-[var(--color-primary-green)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-lg hover:shadow-xl"
              >
                月額プランを始める
              </button>
            </div>

            {/* 年額プラン（おすすめ） */}
            <div className="relative bg-gradient-to-b from-white to-green-50 rounded-3xl shadow-2xl p-10 border-2 border-[var(--color-primary-green)] hover:shadow-[0_25px_60px_rgba(40,99,0,0.3)] hover:-translate-y-2 transition-all duration-300">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-2 rounded-full text-sm font-extrabold shadow-xl hover:scale-110 transition-transform">
                  2ヶ月分お得
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 bg-green-100 rounded-full mb-4">
                  <span className="text-sm font-bold text-[var(--color-primary-green)]">
                    YEARLY
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  年額プラン
                </h3>
                <div className="flex items-end justify-center gap-2">
                  <span className="text-6xl font-extrabold text-[var(--color-primary-green)]">
                    ¥5,500
                  </span>
                  <span className="text-gray-500 pb-3 text-lg">/年</span>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  月額換算:{" "}
                  <span className="font-bold text-[var(--color-primary-green)]">
                    ¥458/月
                  </span>
                </p>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-[var(--color-primary-green)]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">月額プランの全ての機能</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-orange-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-bold">
                    年間¥1,100の節約
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-[var(--color-primary-green)]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">1年間の安心サポート</span>
                </li>
              </ul>

              <button
                onClick={() => openInExternalBrowser('/auth/signup')}
                className="w-full py-4 bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-primary-dark)] text-white font-bold rounded-xl hover:shadow-2xl transition-all shadow-lg"
              >
                年額プランを始める（お得）
              </button>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-3xl p-10 max-w-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg hover:scale-110 transition-transform">
                  <Info className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <p className="text-gray-900 font-extrabold mb-3 text-xl">
                    3ラウンド無料トライアル
                  </p>
                  <p className="text-gray-700 leading-relaxed text-justify">
                    クレジットカード登録不要で、今すぐ3ラウンド分のデータを記録できます。4ラウンド目を記録する際に、プラン選択画面が表示されます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-slate-100 rounded-full">
              <span className="text-slate-800 text-sm font-semibold tracking-wide">
                FAQ
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              よくあるご質問
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-justify md:text-center">
              お客様からよく寄せられる質問にお答えします
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "記録に時間はかかりませんか？",
                a: "1ショットあたり約10-15秒で記録できます。着地点をタップし、必要に応じて風向きや傾斜を選択するだけ。ラウンドの流れを妨げることなく、スムーズに記録できます。",
              },
              {
                q: "本当に効果がありますか？",
                a: "基本的なスイング技術があり、データに基づいて練習する意欲があり、継続的に記録する習慣がつく方には、確実に効果があります。3ヶ月〜半年継続した場合、平均3-7打のスコア改善が期待できます（個人差あり）。ただし、魔法ではありません。練習とラウンドの両輪を回すことが必要です。",
              },
              {
                q: "GPSは使いますか？",
                a: "いいえ、GPSは使用しません。アプリ上のグリッドに着地点をタップするだけで記録できます。そのため、電波の弱いゴルフ場でも問題なく使用できます。",
              },
              {
                q: "データは他の人に見られませんか？",
                a: "完全にプライベートです。あなたのデータは他のユーザーに公開されることはありません。安心してご自身のショットデータを蓄積してください。",
              },
              {
                q: "オフラインでも使えますか？",
                a: "はい、オフラインでも使用できます。PWA（Progressive Web App）として動作するため、ネット環境がなくてもデータを記録でき、後でネットに繋がった時に自動同期されます。",
              },
              {
                q: "3ラウンドの無料トライアル後はどうなりますか？",
                a: "4ラウンド目を記録しようとすると、プラン選択画面が表示されます。継続してご利用いただく場合は、月額プランまたは年額プランをお選びください。プラン登録後は、制限なくすべての機能をご利用いただけます。",
              },
              {
                q: "途中でプランを変更できますか？",
                a: "はい、いつでも変更できます。月額プランから年額プランへの変更も可能です。また、いつでもキャンセルでき、キャンセル後も期間満了までご利用いただけます。",
              },
              {
                q: "どれくらいでデータの傾向が見えますか？",
                a: "3ラウンド程度で仮説が立ち始め、5-10ラウンドで明確な傾向が見えてきます。月1回ラウンドする場合、約3ヶ月で中期段階に到達し、大まかな傾向を把握できます。統計的に信頼性の高い分析には、11ラウンド以上が推奨されます。",
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-white hover:bg-gray-50 rounded-2xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-xl"
              >
                <summary className="cursor-pointer p-8 font-bold text-gray-900 text-lg md:text-xl flex items-center justify-between">
                  <span>{faq.q}</span>
                  <svg
                    className="w-6 h-6 text-gray-500 transform group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-8 pb-8 text-gray-700 leading-relaxed text-justify">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* お問い合わせ */}
      <section className="py-24 bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-rose-100 rounded-full">
              <span className="text-rose-800 text-sm font-semibold tracking-wide">
                お問い合わせ
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              お問い合わせ
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-justify md:text-center">
              ご質問やご要望がございましたら、お気軽にお問い合わせください
            </p>
          </div>

          {submitSuccess ? (
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-3xl p-12 text-center shadow-2xl">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-green-900 mb-4">
                送信完了
              </h3>
              <p className="text-green-800 leading-relaxed text-lg">
                お問い合わせありがとうございます。
                <br />
                2営業日以内にご返信いたします。
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleContactSubmit}
              className="bg-white rounded-3xl shadow-2xl p-10 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300"
            >
              <div className="mb-6">
                <label
                  htmlFor="name"
                  className="block text-sm font-bold text-gray-700 mb-3"
                >
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-[var(--color-primary-green)] focus:outline-none transition-colors"
                  placeholder="山田 太郎"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-gray-700 mb-3"
                >
                  メールアドレス <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    (半角英数字のみ)
                  </span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                  value={contactForm.email}
                  onChange={(e) => {
                    // 半角英数字以外を除外
                    const value = e.target.value.replace(/[^a-zA-Z0-9._%+-@]/g, '');
                    setContactForm({ ...contactForm, email: value });
                  }}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-[var(--color-primary-green)] focus:outline-none transition-colors"
                  placeholder="example@email.com"
                />
              </div>

              <div className="mb-8">
                <label
                  htmlFor="message"
                  className="block text-sm font-bold text-gray-700 mb-3"
                >
                  お問い合わせ内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-[var(--color-primary-green)] focus:outline-none transition-colors resize-none"
                  placeholder="お問い合わせ内容をご記入ください"
                />
              </div>

              {/* 成功メッセージ */}
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-xl">
                  <p className="text-green-700 font-bold text-center">
                    ✓ お問い合わせを受け付けました
                  </p>
                  <p className="text-green-600 text-sm text-center mt-1">
                    担当者より順次ご連絡させていただきます
                  </p>
                </div>
              )}

              {/* エラーメッセージ */}
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-xl">
                  <p className="text-red-700 font-bold text-center">
                    ✗ {submitError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-primary-dark)] text-white font-bold rounded-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSubmitting ? "送信中..." : "送信する"}
              </button>

              <p className="text-sm text-gray-600 mt-6 text-center">
                または、
                <a
                  href="mailto:support@kigasuru.com"
                  className="text-[var(--color-primary-green)] hover:underline font-semibold"
                >
                  support@kigasuru.com
                </a>{" "}
                までメールでお問い合わせください
              </p>
            </form>
          )}
        </div>
      </section>

      {/* 最終CTA */}
      <section className="relative py-32 overflow-hidden bg-[var(--color-primary-dark)]">
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[15%] w-[600px] h-[500px] bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[15%] right-[20%] w-[350px] h-[300px] bg-white/15 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-6xl font-extrabold text-white mb-8 leading-tight">
            次のラウンドから、
            <br />
            新しいゴルフライフが
            <br className="sm:hidden" />
            始まる
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-6 font-medium">
            記録し、練習し、実践すれば、確実に上手くなる。
          </p>
          <p className="text-lg text-white/80 mb-12">
            データとともに、あなたのゴルフは進化し続けます。
          </p>

          <button
            onClick={() => openInExternalBrowser('/auth/signup')}
            className="group px-14 py-6 bg-white text-[var(--color-primary-green)] text-xl font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-2xl hover:scale-105"
          >
            <span className="flex items-center justify-center gap-3">
              3ラウンド無料で始める
              <svg
                className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </button>

          <p className="text-sm text-white/70 mt-8">
            クレジットカード登録不要・3ラウンドまで完全無料
          </p>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* サービス情報 */}
            <div className="md:col-span-2">
              <Image
                src="/assets/images/logo_w.svg"
                alt="上手くなる気がするぅぅぅ"
                width={220}
                height={55}
                className="mb-4"
                style={{ width: '220px', height: 'auto' }}
              />
              <p className="text-gray-400 leading-relaxed mb-6">
                ショットの本当の結果を記録し、感覚のズレを可視化する実践型ゴルフアプリ
              </p>
              <p className="text-gray-500 text-sm">
                データとともに、あなたのゴルフは進化し続けます
              </p>
            </div>

            {/* コンテンツ */}
            <div>
              <h4 className="font-bold mb-6 text-lg">コンテンツ</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/learn/why-golf-is-hard"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    ゴルフが難しい理由
                  </Link>
                </li>
                <li>
                  <Link
                    href="/learn/why-recording"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    なぜ記録が重要か
                  </Link>
                </li>
                <li>
                  <Link
                    href="/learn/growth-cycle"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    成長サイクル
                  </Link>
                </li>
                <li>
                  <Link
                    href="/learn/realistic-expectations"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    現実的な期待値
                  </Link>
                </li>
              </ul>
            </div>

            {/* 会社情報 */}
            <div>
              <h4 className="font-bold mb-6 text-lg">会社情報</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://senrigan.systems/company/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    運営会社
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    プライバシーポリシー
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    利用規約
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@kigasuru.com"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    お問い合わせ
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              &copy; 2025 Senrigan Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
