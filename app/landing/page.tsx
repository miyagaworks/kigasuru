'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/Icon';
import { useExternalBrowser } from '@/hooks/useExternalBrowser';

/**
 * ランディングページ - 上手くなる気がするぅぅぅ
 */
export default function LandingPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // 外部ブラウザで開くフック
  const { openInExternalBrowser } = useExternalBrowser();

  // ページ読み込み時にキャッシュをクリアして強制リロード（開発・デバッグ用）
  React.useEffect(() => {
    // ページが完全にロードされたかチェック
    if (typeof window !== 'undefined') {
      // キャッシュコントロール用のタイムスタンプをチェック
      const lastUpdate = localStorage.getItem('landing-last-update');
      const currentVersion = '2025-10-16-v4'; // デプロイごとに変更

      if (lastUpdate !== currentVersion) {
        console.log('[Landing] New version detected, clearing cache');
        localStorage.setItem('landing-last-update', currentVersion);

        // Service Workerのキャッシュをクリア
        if ('serviceWorker' in navigator && 'caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }
      }
    }
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setContactForm({ name: '', email: '', message: '' });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Google Analytics Placeholder */}
      {/* TODO: Add Google Analytics tracking code */}

      {/* Conversion Tracking Placeholder */}
      {/* TODO: Add conversion tracking code */}


      {/* ヒーローセクション */}
      <section
        className="relative min-h-screen flex items-center justify-center text-center overflow-hidden"
        style={{
          backgroundImage: "url(/landing/images/hero-background.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* オーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>

        {/* コンテンツ */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
          <div className="inline-block mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
            <span className="text-white/90 text-sm font-medium tracking-wide">
              実践型ゴルフ分析アプリ
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-tight">
            あなたの感覚、
            <br />
            本当に合っていますか？
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-6 font-medium">
            実際の結果を知ることが、上達への最短距離。
          </p>

          <p className="text-base md:text-lg text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            スイング分析でもスコア管理でもない。
            <br className="hidden md:block" />
            ショットの&ldquo;本当の結果&rdquo;を記録し、感覚のズレを可視化する実践型アプリ。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => openInExternalBrowser('/auth/signup')}
              className="group px-10 py-5 bg-[var(--color-primary-green)] text-white text-lg font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-2xl hover:shadow-[var(--color-primary-green)]/50 hover:scale-105"
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
            <a
              href="#features"
              className="px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-lg font-bold rounded-xl hover:bg-white/20 transition-all"
            >
              詳しく見る
            </a>
          </div>

          <p className="text-sm text-white/70">
            ※クレジットカード登録不要で今すぐお試しいただけます
          </p>
        </div>

        {/* スクロールダウンアイコン */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-2 bg-white/60 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* 問題提起セクション */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-neutral-900)] mb-6">
              こんな経験、ありませんか？
            </h2>
            <p className="text-lg text-[var(--color-neutral-600)] max-w-2xl mx-auto">
              多くのゴルファーが抱える、感覚と実際のギャップ
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 問題1 */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-[var(--color-primary-green)]/30">
              <div className="w-16 h-16 mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Icon
                  category="ui"
                  name="analysis"
                  size={32}
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-neutral-900)] mb-4">
                感覚と実際の
                <br />
                ギャップに気づけない
              </h3>
              <p className="text-[var(--color-neutral-600)] leading-relaxed text-justify">
                「いつも右に曲がる気がする」...本当にそうでしょうか？感覚と実際の結果のズレに気づいていないかもしれません。
              </p>
            </div>

            {/* 問題2 */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-[var(--color-primary-green)]/30">
              <div className="w-16 h-16 mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Icon
                  category="ui"
                  name="weather"
                  size={32}
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-neutral-900)] mb-4">
                条件による影響を
                <br />
                正確に把握できていない
              </h3>
              <p className="text-[var(--color-neutral-600)] leading-relaxed text-justify">
                風や傾斜を考慮したつもりが、また外れた。条件による影響を正確に把握できていますか？
              </p>
            </div>

            {/* 問題3 */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-[var(--color-primary-green)]/30">
              <div className="w-16 h-16 mb-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Icon
                  category="ui"
                  name="target"
                  size={32}
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-neutral-900)] mb-4">
                同じミスを
                <br />
                繰り返してしまう
              </h3>
              <p className="text-[var(--color-neutral-600)] leading-relaxed text-justify">
                練習しても同じミスを繰り返す。何が原因かわからず、感覚だけで修正しようとしていませんか？
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 解決策セクション */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-neutral-900)] mb-6">
              感覚のズレを、データで可視化する
            </h2>
            <p className="text-lg text-[var(--color-neutral-600)] max-w-2xl mx-auto">
              「上手くなる気がするぅぅぅ」が提供する3つの価値
            </p>
          </div>

          <div className="space-y-32">
            {/* 特徴1 */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-50 to-blue-100 aspect-[4/3] flex items-center justify-center">
                  <Image
                    src="/landing/visualizations/viz-shot-pattern.png"
                    alt="ショットパターンの可視化"
                    width={700}
                    height={525}
                    className="rounded-3xl"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                    <div className="text-center p-8">
                      <Icon
                        category="ui"
                        name="analysis"
                        size={64}
                        className="mx-auto mb-4 opacity-30"
                      />
                      <p className="text-lg font-bold">
                        ショットパターン可視化
                      </p>
                      <p className="text-sm mt-2 opacity-70">
                        画像を配置してください
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-50 rounded-full mb-6">
                  <span className="text-blue-600 font-bold text-sm">
                    FEATURE
                  </span>
                  <span className="text-2xl font-bold text-blue-600">01</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-[var(--color-neutral-900)] mb-6 flex items-center gap-3">
                  <Icon
                    category="ui"
                    name="target"
                    size={36}
                    style={{
                      filter:
                        "invert(37%) sepia(93%) saturate(370%) hue-rotate(54deg) brightness(94%) contrast(97%)",
                    }}
                  />
                  実際の着地点を記録
                </h3>

                <p className="text-xl text-[var(--color-neutral-700)] mb-6 leading-relaxed">
                  狙った場所と実際に落ちた場所。
                  <br />
                  そのズレこそが、あなたの本当の課題です。
                </p>

                <div className="bg-gray-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
                  <p className="text-[var(--color-neutral-600)] leading-relaxed text-justify">
                    &ldquo;まっすぐ打っているつもり&rdquo;が、実はいつも右に8ヤードズレていた。データで見える化することで、思い込みから脱却できます。
                  </p>
                </div>
              </div>
            </div>

            {/* 特徴2 */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-green-50 to-green-100 aspect-[4/3] flex items-center justify-center">
                  <Image
                    src="/landing/visualizations/viz-condition-comparison.png"
                    alt="条件別比較"
                    width={700}
                    height={525}
                    className="rounded-3xl"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-green-600">
                    <div className="text-center p-8">
                      <Icon
                        category="ui"
                        name="weather"
                        size={64}
                        className="mx-auto mb-4 opacity-30"
                      />
                      <p className="text-lg font-bold">条件別パフォーマンス</p>
                      <p className="text-sm mt-2 opacity-70">
                        画像を配置してください
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-green-50 rounded-full mb-6">
                  <span className="text-green-600 font-bold text-sm">
                    FEATURE
                  </span>
                  <span className="text-2xl font-bold text-green-600">02</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-[var(--color-neutral-900)] mb-6 flex items-center gap-3">
                  <Icon
                    category="ui"
                    name="weather"
                    size={36}
                    style={{
                      filter:
                        "invert(37%) sepia(93%) saturate(370%) hue-rotate(54deg) brightness(94%) contrast(97%)",
                    }}
                  />
                  あらゆる条件を記録
                </h3>

                <p className="text-xl text-[var(--color-neutral-700)] mb-6 leading-relaxed">
                  同じクラブでも、条件が変われば結果は変わる。
                  <br />
                  全ての要素を記録し、パターンを見つけます。
                </p>

                <div className="bg-gray-50 border-l-4 border-green-500 p-6 rounded-r-xl">
                  <p className="text-[var(--color-neutral-600)] leading-relaxed text-justify">
                    傾斜、ライ、風、気温など、ショットに影響する全ての要素を記録。&ldquo;この条件の時は、こう打つべき&rdquo;という実践知が蓄積されます。
                  </p>
                </div>
              </div>
            </div>

            {/* 特徴3 */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 aspect-[4/3] flex items-center justify-center">
                  <Image
                    src="/landing/visualizations/viz-club-accuracy.png"
                    alt="クラブ別精度分析"
                    width={700}
                    height={525}
                    className="rounded-3xl"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-orange-600">
                    <div className="text-center p-8">
                      <Icon
                        category="ui"
                        name="analysis"
                        size={64}
                        className="mx-auto mb-4 opacity-30"
                      />
                      <p className="text-lg font-bold">クラブ別精度分析</p>
                      <p className="text-sm mt-2 opacity-70">
                        画像を配置してください
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-orange-50 rounded-full mb-6">
                  <span className="text-orange-600 font-bold text-sm">
                    FEATURE
                  </span>
                  <span className="text-2xl font-bold text-orange-600">03</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-[var(--color-neutral-900)] mb-6 flex items-center gap-3">
                  <Icon
                    category="clubs"
                    name="7I"
                    size={36}
                    style={{
                      filter:
                        "invert(37%) sepia(93%) saturate(370%) hue-rotate(54deg) brightness(94%) contrast(97%)",
                    }}
                  />
                  クラブ別の傾向を分析
                </h3>

                <p className="text-xl text-[var(--color-neutral-700)] mb-6 leading-relaxed">
                  7番アイアンは右に10ヤード、PWは左に5ヤード。
                  <br />
                  あなたの&ldquo;クセ&rdquo;が一目瞭然。
                </p>

                <div className="bg-gray-50 border-l-4 border-orange-500 p-6 rounded-r-xl">
                  <p className="text-[var(--color-neutral-600)] leading-relaxed text-justify">
                    各クラブごとの精度、方向性、距離の傾向を可視化。どのクラブが得意で、どのクラブを重点的に練習すべきかが明確になります。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 従来のアプリとの違い */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-neutral-900)] mb-6">
              スイング分析でも、
              <br className="md:hidden" />
              スコア管理でもない。
            </h2>
            <p className="text-lg text-[var(--color-neutral-600)]">
              実戦での&ldquo;本当の結果&rdquo;にフォーカスした、唯一のアプリ
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-primary-dark)] text-white">
                <tr>
                  <th className="px-6 py-5 text-left font-bold">項目</th>
                  <th className="px-6 py-5 text-left font-bold">
                    従来のアプリ
                  </th>
                  <th className="px-6 py-5 text-left font-bold">
                    上手くなる気がするぅぅぅ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5 font-semibold text-[var(--color-neutral-900)]">
                    記録するもの
                  </td>
                  <td className="px-6 py-5 text-[var(--color-neutral-600)]">
                    スイング軌道の分析
                  </td>
                  <td className="px-6 py-5 font-bold text-[var(--color-primary-green)]">
                    ✓ 実際の着地点を記録
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                  <td className="px-6 py-5 font-semibold text-[var(--color-neutral-900)]">
                    目的
                  </td>
                  <td className="px-6 py-5 text-[var(--color-neutral-600)]">
                    スコアの記録・管理
                  </td>
                  <td className="px-6 py-5 font-bold text-[var(--color-primary-green)]">
                    ✓ ショットの精度を可視化
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5 font-semibold text-[var(--color-neutral-900)]">
                    アプローチ
                  </td>
                  <td className="px-6 py-5 text-[var(--color-neutral-600)]">
                    理想のフォームを目指す
                  </td>
                  <td className="px-6 py-5 font-bold text-[var(--color-primary-green)]">
                    ✓ 自分の傾向を知り、対応力を磨く
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-12 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-[var(--color-secondary-blue)] p-8 rounded-r-2xl">
            <p className="text-lg text-[var(--color-neutral-700)] font-semibold mb-3 text-justify">
              「練習場でのスイングがどんなに綺麗でも、コースで結果が出なければ意味がない。」
            </p>
            <p className="text-[var(--color-neutral-600)] text-justify">
              上手くなる気がするぅぅぅは、実戦での&ldquo;本当の結果&rdquo;にフォーカスした、実践型ゴルフアプリです。
            </p>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-neutral-900)] mb-6">
              シンプルな3ステップで、
              <br className="md:hidden" />
              すぐに始められる
            </h2>
            <p className="text-lg text-[var(--color-neutral-600)]">
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
              <h3 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4 flex items-center justify-center gap-2">
                <Icon
                  category="ui"
                  name="golf"
                  size={28}
                  style={{
                    filter:
                      "invert(37%) sepia(93%) saturate(370%) hue-rotate(54deg) brightness(94%) contrast(97%)",
                  }}
                />
                ショットを打つ
              </h3>
              <p className="text-[var(--color-neutral-600)] leading-relaxed">
                いつも通りラウンド。
                <br />
                ショットを打ったら、アプリを開く。
              </p>
            </div>

            {/* ステップ2 */}
            <div className="relative text-center group">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-100 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all">
                <span className="text-5xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4 flex items-center justify-center gap-2">
                <Icon
                  category="ui"
                  name="record"
                  size={28}
                  style={{
                    filter:
                      "invert(37%) sepia(93%) saturate(370%) hue-rotate(54deg) brightness(94%) contrast(97%)",
                  }}
                />
                結果を記録
              </h3>
              <p className="text-[var(--color-neutral-600)] leading-relaxed">
                着地点をタップ。
                <br />
                傾斜や風などの条件も簡単入力。
              </p>
            </div>

            {/* ステップ3 */}
            <div className="relative text-center group">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-100 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all">
                <span className="text-5xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4 flex items-center justify-center gap-2">
                <Icon
                  category="ui"
                  name="analysis"
                  size={28}
                  style={{
                    filter:
                      "invert(37%) sepia(93%) saturate(370%) hue-rotate(54deg) brightness(94%) contrast(97%)",
                  }}
                />
                データで確認
              </h3>
              <p className="text-[var(--color-neutral-600)] leading-relaxed">
                クラブ別の傾向、
                <br />
                条件別の精度が自動で分析される。
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={() => openInExternalBrowser('/auth/signup')}
              className="group px-12 py-5 bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-primary-dark)] text-white text-lg font-bold rounded-xl hover:shadow-2xl hover:shadow-[var(--color-primary-green)]/30 transition-all transform hover:scale-105"
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
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-neutral-900)] mb-6">
              まずは無料で試せます
            </h2>
            <p className="text-lg text-[var(--color-neutral-600)]">
              3ラウンド分のデータを記録して、効果を実感してください
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* 月額プラン */}
            <div className="bg-white rounded-2xl shadow-lg p-10 border-2 border-gray-200 hover:border-[var(--color-primary-green)] hover:shadow-2xl transition-all">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 bg-gray-100 rounded-full mb-4">
                  <span className="text-sm font-bold text-gray-600">
                    MONTHLY
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4">
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
                <li className="flex items-start gap-3">
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
                  <span className="text-[var(--color-neutral-700)]">
                    無制限のショット記録
                  </span>
                </li>
                <li className="flex items-start gap-3">
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
                  <span className="text-[var(--color-neutral-700)]">
                    全ての分析機能
                  </span>
                </li>
                <li className="flex items-start gap-3">
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
                  <span className="text-[var(--color-neutral-700)]">
                    データのエクスポート
                  </span>
                </li>
                <li className="flex items-start gap-3">
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
                  <span className="text-[var(--color-neutral-700)]">
                    いつでもキャンセル可能
                  </span>
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
            <div className="relative bg-gradient-to-b from-white to-green-50 rounded-2xl shadow-2xl p-10 border-2 border-[var(--color-primary-green)]">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-2 rounded-full text-sm font-bold shadow-lg">
                  2ヶ月分お得
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 bg-green-100 rounded-full mb-4">
                  <span className="text-sm font-bold text-[var(--color-primary-green)]">
                    YEARLY
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4">
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
                <li className="flex items-start gap-3">
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
                  <span className="text-[var(--color-neutral-700)]">
                    月額プランの全ての機能
                  </span>
                </li>
                <li className="flex items-start gap-3">
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
                  <span className="text-[var(--color-neutral-700)] font-bold">
                    年間¥1,100の節約
                  </span>
                </li>
                <li className="flex items-start gap-3">
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
                  <span className="text-[var(--color-neutral-700)]">
                    1年間の安心サポート
                  </span>
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
            <div className="inline-block bg-blue-50 border border-blue-200 rounded-2xl p-8 max-w-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon
                    category="ui"
                    name="info"
                    size={24}
                    style={{ filter: "brightness(0) invert(1)" }}
                  />
                </div>
                <div className="text-left">
                  <p className="text-[var(--color-neutral-900)] font-bold mb-2 text-lg">
                    3ラウンド無料トライアル
                  </p>
                  <p className="text-[var(--color-neutral-600)] leading-relaxed text-justify">
                    クレジットカード登録不要で、今すぐ3ラウンド分のデータを記録できます。4ラウンド目を記録する際に、プラン選択画面が表示されます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-neutral-900)] mb-6">
              よくあるご質問
            </h2>
            <p className="text-lg text-[var(--color-neutral-600)]">
              お客様からよく寄せられる質問にお答えします
            </p>
          </div>

          <div className="space-y-4 text-justify">
            {[
              {
                q: "記録に時間はかかりませんか？",
                a: "1ショットあたり約10-15秒で記録できます。着地点をタップし、必要に応じて風向きや傾斜を選択するだけ。ラウンドの流れを妨げることなく、スムーズに記録できます。",
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
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
              >
                <summary className="cursor-pointer p-6 font-bold text-[var(--color-neutral-900)] text-lg flex items-center justify-between">
                  <span>{faq.q}</span>
                  <svg
                    className="w-5 h-5 text-gray-500 transform group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
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
                <div className="px-6 pb-6 text-[var(--color-neutral-600)] leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* お問い合わせ */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-neutral-900)] mb-6">
              お問い合わせ
            </h2>
            <p className="text-lg text-[var(--color-neutral-600)]">
              ご質問やご要望がございましたら、お気軽にお問い合わせください
            </p>
          </div>

          {submitSuccess ? (
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
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
              <h3 className="text-2xl font-bold text-green-900 mb-3">
                送信完了
              </h3>
              <p className="text-green-700 leading-relaxed">
                お問い合わせありがとうございます。
                <br />
                2営業日以内にご返信いたします。
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleContactSubmit}
              className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100"
            >
              <div className="mb-6">
                <label
                  htmlFor="name"
                  className="block text-sm font-bold text-[var(--color-neutral-700)] mb-3"
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
                  className="block text-sm font-bold text-[var(--color-neutral-700)] mb-3"
                >
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-[var(--color-primary-green)] focus:outline-none transition-colors"
                  placeholder="example@email.com"
                />
              </div>

              <div className="mb-8">
                <label
                  htmlFor="message"
                  className="block text-sm font-bold text-[var(--color-neutral-700)] mb-3"
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-primary-dark)] text-white font-bold rounded-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSubmitting ? "送信中..." : "送信する"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 最終CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-green)] via-[var(--color-primary-dark)] to-green-900"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 leading-tight">
            今日から、データで上達する。
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-6 font-medium">
            感覚ではなく、事実を知ることから始めよう。
          </p>
          <p className="text-lg text-white/80 mb-12">
            3ラウンド無料で、あなたのゴルフが変わります。
          </p>

          <button
            onClick={() => openInExternalBrowser('/auth/signup')}
            className="group px-14 py-6 bg-white text-[var(--color-primary-green)] text-xl font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-2xl hover:scale-105"
          >
            <span className="flex items-center justify-center gap-3">
              無料で始める
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
      <footer className="bg-[var(--color-neutral-900)] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* サービス情報 */}
            <div>
              <Image
                src="/assets/images/logo_w.svg"
                alt="上手くなる気がするぅぅぅ"
                width={240}
                height={60}
                className="mb-4"
              />
              <p className="text-gray-400 leading-relaxed">
                ショットの本当の結果を記録し、
                <br />
                感覚のズレを可視化する
                <br />
                実践型ゴルフアプリ
              </p>
            </div>

            {/* リンク */}
            <div>
              <h4 className="font-bold mb-6 text-lg">サービス</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    機能紹介
                  </a>
                </li>
                <li>
                  <a
                    href="/auth/signup"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    無料で始める
                  </a>
                </li>
                <li>
                  <a
                    href="/auth/signin"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    ログイン
                  </a>
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
                    href="/transactions"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:w-2 group-hover:h-2 transition-all"></span>
                    特定商取引法に基づく表記
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector('section:has(h2:contains("お問い合わせ"))')?.scrollIntoView({ behavior: 'smooth' });
                    }}
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
