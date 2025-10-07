'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { getAllShots, getStatistics, type Shot } from '@/lib/db';
import LineFriendConfirmFlow from '@/components/line/LineFriendConfirmFlow';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';

interface Statistics {
  count: number;
  avgDistance: number;
  resultCounts: Record<string, number>;
  mostCommonResult: string | null;
  mostUsedClub?: string;
}

/**
 * Dashboard page - Main entry point after login
 */
export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLineBanner, setShowLineBanner] = useState(false);
  const [needsAdditionalAuth, setNeedsAdditionalAuth] = useState(false);

  useEffect(() => {
    loadData();
    loadPromotionStatus();
    checkAuthStatus();
  }, []);

  const loadData = async () => {
    try {
      const shots = await getAllShots();

      // 統計情報を計算
      const statistics = await getStatistics({});

      // 最も使用しているクラブを計算
      if (shots.length > 0) {
        const clubCounts = shots.reduce((acc: Record<string, number>, shot: Shot) => {
          acc[shot.club] = (acc[shot.club] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const mostUsedClub = Object.keys(clubCounts).reduce((a, b) =>
          clubCounts[a] > clubCounts[b] ? a : b
        );

        setStats({
          ...statistics!,
          mostUsedClub,
        });
      } else {
        setStats(statistics);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPromotionStatus = async () => {
    try {
      const response = await fetch('/api/line/apply-promotion');
      if (response.ok) {
        const data = await response.json();
        // トライアル期間中で、まだプロモーションを適用していない場合にバナーを表示
        setShowLineBanner(data.isEligible && !data.isApplied);
      }
    } catch (error) {
      console.error('Failed to load promotion status:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setNeedsAdditionalAuth(data.user?.needsAdditionalAuth || false);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        {/* App title */}
        <div className="text-center mb-8 mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_top.svg"
            alt="上手くなる気がするぅぅぅ PRO"
            className="mx-auto mb-4"
            style={{ maxWidth: "100%", height: "auto" }}
          />
          <p className="text-base text-[var(--color-neutral-900)] mt-2">
            本気で自己ベスト更新を狙う人のための<br />
            ゆるい名前の科学的ゴルフ上達アプリ
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="space-y-4">
          <button
            onClick={() => router.push("/record")}
            className="w-full flex items-center justify-center gap-4 rounded-xl px-8 py-5 text-lg min-h-[64px] font-semibold transition-all duration-200 active:scale-98 shadow-lg bg-gradient-to-br from-primary-green to-primary-light text-white hover:shadow-xl hover:scale-[1.02]"
          >
            <Icon
              category="ui"
              name="record"
              size={36}
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <span className="text-xl font-bold">ショット記録</span>
          </button>

          <button
            onClick={() => router.push("/analysis")}
            className="w-full flex items-center justify-center gap-4 rounded-xl px-8 py-5 text-lg min-h-[64px] font-semibold transition-all duration-200 active:scale-98 shadow-lg bg-gradient-to-br from-secondary-blue to-blue-600 text-white hover:shadow-xl hover:scale-[1.02]"
          >
            <Icon
              category="ui"
              name="analysis"
              size={36}
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <span className="text-xl font-bold">データ分析</span>
          </button>
        </div>

        {/* LINE Friend Campaign Modal */}
        {showLineBanner && (
          <LineFriendConfirmFlow
            onComplete={() => {
              setShowLineBanner(false);
              loadPromotionStatus();
            }}
          />
        )}

        {/* Getting started guide */}
        <div className="mt-8 bg-[var(--color-info-bg)] rounded-lg border border-[var(--color-info-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--color-info-text)] mb-4 flex items-center gap-2">
            <Icon category="ui" name="settings" size={24} />
            まずは入力設定をしましょう
          </h2>
          <p className="text-sm text-[var(--color-info-text)] mb-4 text-justify">
            あなたのレベルに合わせて、入力する項目をカスタマイズできます。
          </p>

          {/* Level comparison table */}
          <div className="space-y-3 mb-4">
            {/* Beginner */}
            <div className="bg-white/50 rounded-lg p-3">
              <div className="font-bold text-[var(--color-info-text)] mb-2 text-sm">
                初心者
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1.5 bg-[var(--color-primary-green)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  傾斜
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-primary-green)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  クラブ
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-primary-green)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  結果
                </span>
              </div>
            </div>

            {/* Intermediate */}
            <div className="bg-white/50 rounded-lg p-3">
              <div className="font-bold text-[var(--color-info-text)] mb-2 text-sm">
                中級者
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1.5 bg-[var(--color-secondary-blue)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  傾斜
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-secondary-blue)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  クラブ
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-secondary-blue)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  ライ
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-secondary-blue)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  強度
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-secondary-blue)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  結果
                </span>
              </div>
            </div>

            {/* Advanced */}
            <div className="bg-white/50 rounded-lg p-3">
              <div className="font-bold text-[var(--color-info-text)] mb-2 text-sm">
                上級者
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1.5 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  傾斜
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  クラブ
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  ライ
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  強度
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  風向き
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  気温
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  感触
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  メモ
                </span>
                <span className="px-4 py-1.5 bg-[var(--color-neutral-700)] text-white text-xs font-medium rounded-full whitespace-nowrap">
                  結果
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => router.push("/settings#input-settings")}
            className="w-full bg-[var(--color-secondary-blue)] hover:bg-blue-700"
          >
            設定ページへ
          </Button>
        </div>

        {/* Statistics summary */}
        {!loading && stats && stats.count > 0 && (
          <div className="mt-8 bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
              統計サマリー
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-[var(--color-neutral-600)] mb-2">
                  総ショット数
                </p>
                <p className="text-3xl font-bold text-[var(--color-primary-green)]">
                  {stats.count}
                </p>
              </div>

              <div className="text-center border-x border-[var(--color-neutral-300)]">
                <p className="text-xs text-[var(--color-neutral-600)] mb-2">
                  平均飛距離
                </p>
                <p className="text-3xl font-bold text-[var(--color-secondary-blue)]">
                  {stats.avgDistance}
                </p>
                <p className="text-xs text-[var(--color-neutral-500)] mt-1">
                  ヤード
                </p>
              </div>

              {stats.mostUsedClub && (
                <div className="text-center">
                  <p className="text-xs text-[var(--color-neutral-600)] mb-2">
                    よく使うクラブ
                  </p>
                  <p className="text-3xl font-bold text-[var(--color-neutral-900)]">
                    {stats.mostUsedClub.toUpperCase()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <PwaInstallBanner needsAdditionalAuth={needsAdditionalAuth} />
    </Layout>
  );
};
