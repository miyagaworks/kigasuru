'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { getAllShots, getStatistics, type Shot, getSetting } from '@/lib/db';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { SettingsGuideModal } from '@/components/SettingsGuideModal';

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
  const [needsAdditionalAuth, setNeedsAdditionalAuth] = useState(false);
  const [showSettingsGuide, setShowSettingsGuide] = useState(true);

  useEffect(() => {
    loadData();
    checkAuthStatus();
    checkSettingsStatus();
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

  const checkSettingsStatus = async () => {
    try {
      // デフォルトクラブ設定
      const DEFAULT_CLUBS = ['DR', '3W', '5W', '7W', 'U4', 'U5', '5I', '6I', '7I', '8I', '9I', 'PW', '50', '52', '54', '56', '58'];

      // 入力レベルと入力フィールドを確認
      const inputLevel = await getSetting('inputLevel');
      const inputFields = await getSetting('inputFields');
      const clubs = await getSetting('clubs');

      // 設定がデフォルトから変更されているかチェック
      const levelChanged = inputLevel && inputLevel !== 'advanced';
      const fieldsChanged = inputFields && JSON.stringify(inputFields) !== JSON.stringify({
        slope: true,
        lie: true,
        club: true,
        strength: true,
        wind: true,
        temperature: true,
        feeling: true,
        memo: true,
      });
      const clubsChanged = clubs && JSON.stringify(clubs) !== JSON.stringify(DEFAULT_CLUBS);

      // いずれかの設定が変更されていればガイドを非表示
      if (levelChanged || fieldsChanged || clubsChanged) {
        setShowSettingsGuide(false);
      }
    } catch (error) {
      console.error('Failed to check settings status:', error);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Quick action buttons */}
        <div className="space-y-4">
          <button
            onClick={() => router.push("/record")}
            className="w-full flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-base min-h-[56px] font-semibold transition-all duration-200 active:scale-98 shadow-lg bg-gradient-to-br from-primary-green to-primary-light text-white hover:shadow-xl hover:scale-[1.02]"
          >
            <Icon
              category="ui"
              name="record"
              size={28}
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <span className="text-lg font-bold">ショット記録</span>
          </button>

          <button
            onClick={() => router.push("/analysis")}
            className="w-full flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-base min-h-[56px] font-semibold transition-all duration-200 active:scale-98 shadow-lg bg-gradient-to-br from-secondary-blue to-blue-600 text-white hover:shadow-xl hover:scale-[1.02]"
          >
            <Icon
              category="ui"
              name="analysis"
              size={28}
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <span className="text-lg font-bold">データ分析</span>
          </button>
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
      <SettingsGuideModal
        isOpen={showSettingsGuide}
        onClose={() => setShowSettingsGuide(false)}
      />
    </Layout>
  );
};
