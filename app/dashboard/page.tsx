'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Layout } from '@/components/Layout';
import { getAllShots, type Shot, getSetting } from '@/lib/db';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { SettingsGuideModal } from '@/components/SettingsGuideModal';

interface ClubPerformance {
  club: string;
  accuracy: number;
  shotCount: number;
  avgDistance: number;
}

interface DistancePerformance {
  range: string;
  label: string;
  accuracy: number;
  shotCount: number;
}

interface ClubTrend {
  club: string;
  recentAvg: number;
  previousAvg: number;
  change: number;
  trend: 'improving' | 'stable' | 'declining';
  shotCount: number;
}

interface ClubMissPerformance {
  club: string;
  missTypeCounts: Record<string, number>; // missType -> count
  totalMissCount: number;
  shotCount: number;
}

/**
 * Dashboard page - Main entry point after login
 */
export default function DashboardPage() {
  const { data: session } = useSession();
  const [todayClubPerformance, setTodayClubPerformance] = useState<ClubPerformance[]>([]);
  const [allClubPerformance, setAllClubPerformance] = useState<ClubPerformance[]>([]);
  const [worstClubs, setWorstClubs] = useState<ClubPerformance[]>([]);
  const [distancePerformance, setDistancePerformance] = useState<DistancePerformance[]>([]);
  const [clubTrends, setClubTrends] = useState<ClubTrend[]>([]);
  const [clubsNeedingPractice, setClubsNeedingPractice] = useState<ClubMissPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAdditionalAuth, setNeedsAdditionalAuth] = useState(false);
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);
  const [settingsGuideTemporarilyClosed, setSettingsGuideTemporarilyClosed] = useState(false);

  const router = useRouter();

  // Prefetch main pages for offline use
  const prefetchMainPages = useCallback(() => {
    // Only prefetch when online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      console.log('[Dashboard] Prefetching main pages for offline use...');

      // Use Next.js router prefetch - this will prefetch JS chunks too
      const pages = ['/record', '/analysis', '/settings', '/history'];
      pages.forEach(page => {
        router.prefetch(page);
        console.log('[Dashboard] Prefetching:', page);
      });

      console.log('[Dashboard] Main pages prefetch initiated');
    }
  }, [router]);

  useEffect(() => {
    loadData();
    checkAuthStatus();
    prefetchMainPages();
  }, [prefetchMainPages]);

  // Check settings status only after session is ready
  useEffect(() => {
    if (session?.user?.id) {
      console.log('[Dashboard] Session ready, checking settings for user:', session.user.id);
      checkSettingsStatus();
    }
  }, [session?.user?.id]);

  const loadData = async () => {
    try {
      // Try to fetch from server first (if online)
      let shots: Shot[] = [];
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

      if (isOnline) {
        try {
          const response = await fetch('/api/shots');
          if (response.ok) {
            const result = await response.json();
            shots = result.shots || [];
            console.log('[Dashboard] Loaded', shots.length, 'shots from server');
          } else {
            throw new Error('Failed to fetch from server');
          }
        } catch (error) {
          console.error('[Dashboard] Failed to load from server, falling back to IndexedDB:', error);
          shots = await getAllShots();
        }
      } else {
        // Offline: Load from IndexedDB
        console.log('[Dashboard] Offline - loading from IndexedDB');
        shots = await getAllShots();
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 今日のショットを抽出
      const todayShots = shots.filter((shot: Shot) => {
        const shotDate = new Date(shot.date);
        shotDate.setHours(0, 0, 0, 0);
        return shotDate.getTime() === today.getTime();
      });

      // クラブ別パフォーマンスを計算する関数
      const calculateClubPerformance = (targetShots: Shot[]): ClubPerformance[] => {
        const clubData: Record<string, { totalDiff: number; count: number; shotCount: number; totalDistance: number; distanceCount: number }> = {};

        targetShots.forEach(shot => {
          if (!clubData[shot.club]) {
            clubData[shot.club] = { totalDiff: 0, count: 0, shotCount: 0, totalDistance: 0, distanceCount: 0 };
          }
          clubData[shot.club].shotCount++;

          if (shot.result !== null && typeof shot.result === 'object' && shot.result.x !== undefined) {
            // 結果の位置からの距離を計算（精度）
            const x = shot.result.x || 0;
            const y = shot.result.y || 0;
            const diff = Math.round(Math.sqrt(x * x + y * y));
            clubData[shot.club].totalDiff += diff;
            clubData[shot.club].count++;

            // 実際の飛距離を計算（目標距離 + y軸のズレ）
            if (shot.distance !== null && shot.distance > 0) {
              const actualDistance = shot.distance + y;
              clubData[shot.club].totalDistance += actualDistance;
              clubData[shot.club].distanceCount++;
            }
          }
        });

        return Object.entries(clubData).map(([club, data]) => ({
          club,
          accuracy: data.count > 0 ? Math.round(data.totalDiff / data.count) : 0,
          shotCount: data.shotCount,
          avgDistance: data.distanceCount > 0 ? Math.round(data.totalDistance / data.distanceCount) : 0
        }));
      };

      // 距離別パフォーマンスを計算する関数
      const calculateDistancePerformance = (targetShots: Shot[]): DistancePerformance[] => {
        const distanceRanges = [
          { range: '0-60', label: '60Yd以内', min: 0, max: 60 },
          { range: '61-120', label: '61~120Yd', min: 61, max: 120 },
          { range: '121-180', label: '121~180Yd', min: 121, max: 180 },
          { range: '181+', label: '180Yd以上', min: 181, max: Infinity },
        ];

        return distanceRanges.map(({ range, label, min, max }) => {
          const rangeShots = targetShots.filter(shot => {
            if (!shot.distance || shot.distance === null) return false;
            return shot.distance >= min && shot.distance <= max;
          });

          if (rangeShots.length === 0) {
            return { range, label, accuracy: 0, shotCount: 0 };
          }

          // 精度を計算（目標地点からのズレの平均）
          const shotsWithResult = rangeShots.filter(shot => shot.result !== null);
          let avgAccuracy = 0;

          if (shotsWithResult.length > 0) {
            const totalDiff = shotsWithResult.reduce((sum, shot) => {
              const x = shot.result?.x || 0;
              const y = shot.result?.y || 0;
              const diff = Math.round(Math.sqrt(x * x + y * y));
              return sum + diff;
            }, 0);
            avgAccuracy = Math.round(totalDiff / shotsWithResult.length);
          }

          return {
            range,
            label,
            accuracy: avgAccuracy,
            shotCount: rangeShots.length
          };
        });
      };

      // クラブ別パフォーマンスを設定
      const todayPerf = calculateClubPerformance(todayShots);
      const allPerf = calculateClubPerformance(shots);

      setTodayClubPerformance(todayPerf.sort((a, b) => b.shotCount - a.shotCount));
      setAllClubPerformance(allPerf.sort((a, b) => b.shotCount - a.shotCount));

      // ワースト順のクラブを設定（精度が低い順、3回以上使用したクラブのみ）
      setWorstClubs(allPerf.filter(c => c.accuracy > 0 && c.shotCount >= 3).sort((a, b) => b.accuracy - a.accuracy));

      // 距離別パフォーマンスを設定
      setDistancePerformance(calculateDistancePerformance(shots));

      // クラブ精度の推移を計算
      const calculateClubTrends = (targetShots: Shot[]): ClubTrend[] => {
        // クラブごとにショットを日付順にソート
        const clubShots: Record<string, Shot[]> = {};

        targetShots.forEach(shot => {
          if (!clubShots[shot.club]) {
            clubShots[shot.club] = [];
          }
          clubShots[shot.club].push(shot);
        });

        const trends: ClubTrend[] = [];

        Object.entries(clubShots).forEach(([club, shots]) => {
          // 日付順にソート（古い順）
          const sortedShots = shots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // 5回以上のデータがあるクラブのみ
          if (sortedShots.length < 5) return;

          // resultがあるショットのみフィルター
          const shotsWithResult = sortedShots.filter(shot =>
            shot.result !== null &&
            typeof shot.result === 'object' &&
            shot.result.x !== undefined
          );

          if (shotsWithResult.length < 5) return;

          // 直近5回の平均精度を計算
          const recent5 = shotsWithResult.slice(-5);
          const recentDiffs = recent5.map(shot => {
            const x = shot.result!.x || 0;
            const y = shot.result!.y || 0;
            return Math.round(Math.sqrt(x * x + y * y));
          });
          const recentAvg = Math.round(recentDiffs.reduce((a, b) => a + b, 0) / recentDiffs.length);

          // その前の5回の平均精度を計算（10回以上データがある場合）
          if (shotsWithResult.length >= 10) {
            const previous5 = shotsWithResult.slice(-10, -5);
            const previousDiffs = previous5.map(shot => {
              const x = shot.result!.x || 0;
              const y = shot.result!.y || 0;
              return Math.round(Math.sqrt(x * x + y * y));
            });
            const previousAvg = Math.round(previousDiffs.reduce((a, b) => a + b, 0) / previousDiffs.length);

            // 変化率を計算（精度が良くなる = ズレが小さくなる = マイナス）
            const change = ((recentAvg - previousAvg) / previousAvg) * 100;

            let trend: 'improving' | 'stable' | 'declining';
            if (change <= -5) {
              trend = 'improving'; // 5%以上改善（ズレが小さくなった）
            } else if (change >= 5) {
              trend = 'declining'; // 5%以上悪化（ズレが大きくなった）
            } else {
              trend = 'stable'; // ±5%以内
            }

            trends.push({
              club,
              recentAvg,
              previousAvg,
              change,
              trend,
              shotCount: shotsWithResult.length
            });
          } else {
            // 10回未満の場合は前回との比較なし
            trends.push({
              club,
              recentAvg,
              previousAvg: recentAvg,
              change: 0,
              trend: 'stable',
              shotCount: shotsWithResult.length
            });
          }
        });

        // 改善中のクラブを優先してソート
        return trends.sort((a, b) => {
          if (a.trend === 'improving' && b.trend !== 'improving') return -1;
          if (a.trend !== 'improving' && b.trend === 'improving') return 1;
          if (a.trend === 'declining' && b.trend !== 'declining') return 1;
          if (a.trend !== 'declining' && b.trend === 'declining') return -1;
          return a.change - b.change;
        });
      };

      setClubTrends(calculateClubTrends(shots));

      // 要練習クラブを計算（ミスショットが多いクラブ）
      const calculateClubsNeedingPractice = (targetShots: Shot[]): ClubMissPerformance[] => {
        const clubMissData: Record<string, { missTypeCounts: Record<string, number>; totalMissCount: number; shotCount: number }> = {};

        targetShots.forEach(shot => {
          if (!clubMissData[shot.club]) {
            clubMissData[shot.club] = { missTypeCounts: {}, totalMissCount: 0, shotCount: 0 };
          }
          clubMissData[shot.club].shotCount++;

          // ミスタイプがある場合のみカウント
          if (shot.missType) {
            clubMissData[shot.club].missTypeCounts[shot.missType] =
              (clubMissData[shot.club].missTypeCounts[shot.missType] || 0) + 1;
            clubMissData[shot.club].totalMissCount++;
          }
        });

        // ミスショットが1回以上あるクラブのみフィルター、ミス回数が多い順にソート
        return Object.entries(clubMissData)
          .filter(([, data]) => data.totalMissCount > 0 && data.shotCount >= 3) // 3ショット以上
          .map(([club, data]) => ({
            club,
            missTypeCounts: data.missTypeCounts,
            totalMissCount: data.totalMissCount,
            shotCount: data.shotCount
          }))
          .sort((a, b) => b.totalMissCount - a.totalMissCount);
      };

      setClubsNeedingPractice(calculateClubsNeedingPractice(shots));

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
      console.log('[Dashboard] Checking settings status...');

      // ユーザーが設定ページを訪れたかチェック（settingsVisitedフラグを確認）
      const settingsVisited = await getSetting('settingsVisited');

      console.log('[Dashboard] settingsVisited flag:', settingsVisited);

      if (settingsVisited) {
        console.log('[Dashboard] User has visited settings - hiding guide');
        setShowSettingsGuide(false);
      } else {
        console.log('[Dashboard] User has not visited settings - showing guide');
        setShowSettingsGuide(true);
      }
    } catch (error) {
      console.error('[Dashboard] Failed to check settings status:', error);
      // エラー時はガイドを非表示（ユーザーに邪魔にならないように）
      setShowSettingsGuide(false);
    }
  };

  // データが存在するかチェック
  const hasData = allClubPerformance.length > 0 ||
                  todayClubPerformance.length > 0 ||
                  distancePerformance.some((d) => d.shotCount > 0) ||
                  clubTrends.length > 0 ||
                  worstClubs.length > 0 ||
                  clubsNeedingPractice.length > 0;

  return (
    <Layout>
      <div className="p-4">
        {!loading && (
          <div className="space-y-6">
            {/* スペーサー */}
            <div className="h-4"></div>

            {/* データがない場合は初期画像を表示 */}
            {!hasData && (
              <div className="flex justify-center items-center min-h-[60vh]">
                <Image
                  src="/assets/images/first_dashboard.png"
                  alt="初回ダッシュボード"
                  width={600}
                  height={800}
                  className="max-w-full h-auto rounded-lg"
                  priority
                />
              </div>
            )}

            {/* 1. 今日のクラブ別パフォーマンス */}
            {todayClubPerformance.length > 0 && (
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 border-l-4 border-[var(--color-primary-green)]">
                <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4 flex items-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    className="text-[var(--color-primary-green)]"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 2v10l4 4"
                    />
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  </svg>
                  今日のクラブ別パフォーマンス
                </h2>
                <div className="overflow-x-auto">
                  <div className="flex gap-3 pb-2">
                    {todayClubPerformance.map((club) => (
                      <div
                        key={club.club}
                        className="flex-shrink-0 bg-[var(--color-neutral-100)] rounded-lg p-3 min-w-[120px]"
                      >
                        <p className="text-sm font-bold text-center text-[var(--color-neutral-900)]">
                          {club.club}
                        </p>
                        <p className="text-xs text-center text-[var(--color-neutral-600)] mt-2">
                          平均精度
                        </p>
                        <p className="text-xl font-bold text-center text-[var(--color-secondary-blue)]">
                          {club.accuracy}Yd
                        </p>
                        <p className="text-xs text-center text-[var(--color-neutral-600)] mt-2">
                          平均飛距離
                        </p>
                        <p className="text-xl font-bold text-center text-[var(--color-primary-green)]">
                          {club.avgDistance}Yd
                        </p>
                        <p className="text-xs text-center text-[var(--color-neutral-600)] mt-2">
                          {club.shotCount}ショット
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. 全期間のクラブ別パフォーマンス */}
            {allClubPerformance.length > 0 && (
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 border-l-4 border-[var(--color-secondary-blue)]">
                <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4 flex items-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    className="text-[var(--color-secondary-blue)]"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  全期間クラブ別パフォーマンス
                </h2>
                <div className="overflow-x-auto">
                  <div className="flex gap-3 pb-2">
                    {allClubPerformance.map((club) => (
                      <div
                        key={club.club}
                        className="flex-shrink-0 bg-[var(--color-neutral-100)] rounded-lg p-3 min-w-[120px]"
                      >
                        <p className="text-sm font-bold text-center text-[var(--color-neutral-900)]">
                          {club.club}
                        </p>
                        <p className="text-xs text-center text-[var(--color-neutral-600)] mt-2">
                          平均精度
                        </p>
                        <p className="text-xl font-bold text-center text-[var(--color-secondary-blue)]">
                          {club.accuracy}Yd
                        </p>
                        <p className="text-xs text-center text-[var(--color-neutral-600)] mt-2">
                          平均飛距離
                        </p>
                        <p className="text-xl font-bold text-center text-[var(--color-primary-green)]">
                          {club.avgDistance}Yd
                        </p>
                        <p className="text-xs text-center text-[var(--color-neutral-600)] mt-2">
                          {club.shotCount}ショット
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. 距離別精度 */}
            {distancePerformance.some((d) => d.shotCount > 0) && (
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 border-l-4 border-[var(--color-primary-green)]">
                <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4 flex items-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    className="text-[var(--color-primary-green)]"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  距離別精度（全期間）
                </h2>
                <div className="space-y-3">
                  {distancePerformance
                    .filter((d) => d.shotCount > 0)
                    .map((distance) => (
                      <div
                        key={distance.range}
                        className="flex items-center justify-between bg-[var(--color-neutral-100)] rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-6 h-6 text-[var(--color-primary-green)] flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-base font-bold text-[var(--color-neutral-900)]">
                              {distance.label}
                            </p>
                            <p className="text-xs text-[var(--color-neutral-600)]">
                              {distance.shotCount}ショット
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                            平均精度
                          </p>
                          <p className="text-xl font-bold text-[var(--color-secondary-blue)]">
                            {distance.accuracy}Yd
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 4. クラブ精度の推移 */}
            {clubTrends.length > 0 && (
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 border-l-4 border-[var(--color-secondary-blue)]">
                <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4 flex items-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    className="text-[var(--color-secondary-blue)]"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                  クラブ精度の推移（5ショット以上）
                </h2>
                <div className="space-y-3">
                  {clubTrends.map((trend) => (
                    <div
                      key={trend.club}
                      className="flex items-center justify-between bg-[var(--color-neutral-100)] rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-[var(--color-neutral-700)] flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                          />
                        </svg>
                        <div>
                          <p className="text-base font-bold text-[var(--color-neutral-900)]">
                            {trend.club}
                          </p>
                          <p className="text-xs text-[var(--color-neutral-600)]">
                            {trend.shotCount}ショット
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* 前回の平均 */}
                        {trend.shotCount >= 10 && (
                          <div className="text-right">
                            <p className="text-xs text-[var(--color-neutral-600)]">前回5回</p>
                            <p className="text-sm font-bold text-[var(--color-neutral-700)]">
                              {trend.previousAvg}Yd
                            </p>
                          </div>
                        )}
                        {/* 直近の平均 */}
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-neutral-600)]">直近5回</p>
                          <p className="text-lg font-bold text-[var(--color-secondary-blue)]">
                            {trend.recentAvg}Yd
                          </p>
                        </div>
                        {/* トレンド表示 */}
                        {trend.shotCount >= 10 && (
                          <div className="flex items-center gap-2 min-w-[100px]">
                            {trend.trend === 'improving' && (
                              <>
                                <div className="text-2xl">↗️</div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-[var(--color-primary-green)]">改善中</p>
                                  <p className="text-xs text-[var(--color-primary-green)]">
                                    {Math.abs(Math.round(trend.change))}%
                                  </p>
                                </div>
                              </>
                            )}
                            {trend.trend === 'stable' && (
                              <>
                                <div className="text-2xl">→</div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-[var(--color-neutral-700)]">安定</p>
                                  <p className="text-xs text-[var(--color-neutral-600)]">
                                    {Math.abs(Math.round(trend.change))}%
                                  </p>
                                </div>
                              </>
                            )}
                            {trend.trend === 'declining' && (
                              <>
                                <div className="text-2xl">↘️</div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-[var(--color-secondary-red)]">悪化</p>
                                  <p className="text-xs text-[var(--color-secondary-red)]">
                                    {Math.abs(Math.round(trend.change))}%
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. クラブ別精度（ワースト順） */}
            {worstClubs.length > 0 && (
              <div className="bg-[var(--color-error-bg)] rounded-lg shadow-md p-4 border-l-4 border-[var(--color-error-text)]">
                <h2 className="text-lg font-bold text-[var(--color-error-text)] mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-[var(--color-error-text)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  苦手クラブ（3ショット以上）
                </h2>
                <div className="space-y-2">
                  {worstClubs.slice(0, 5).map((club, index) => (
                    <div
                      key={club.club}
                      className="flex items-center justify-between bg-white/50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        {/* ゴルフクラブアイコン */}
                        <svg
                          className="w-8 h-8 text-[var(--color-neutral-700)] flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                          />
                        </svg>
                        <div className="text-center">
                          <p className={`${index === 0 ? 'text-sm' : 'text-xs'} text-[var(--color-neutral-600)] leading-tight`}>
                            ワースト
                          </p>
                          <p className={`${index === 0 ? 'text-xl' : 'text-base'} font-bold text-[var(--color-secondary-red)] leading-tight`}>
                            {index + 1}位
                          </p>
                        </div>
                        <div>
                          <span className="text-lg font-bold text-[var(--color-neutral-900)]">
                            {club.club}
                          </span>
                          <p className="text-xs text-[var(--color-neutral-600)]">
                            {club.shotCount}ショット
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                          平均精度
                        </p>
                        <p className="font-bold text-[var(--color-secondary-red)]">
                          {club.accuracy} Yd
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. 要練習クラブ（ミスショットが多い順） */}
            {clubsNeedingPractice.length > 0 && (
              <div className="bg-[var(--color-warning-bg)] rounded-lg shadow-md p-4 border-l-4 border-[var(--color-warning-text)]">
                <h2 className="text-lg font-bold text-[var(--color-warning-text)] mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-[var(--color-warning-text)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  要練習クラブ（3ショット以上）
                </h2>
                <div className="space-y-2">
                  {clubsNeedingPractice.slice(0, 3).map((club, index) => {
                    // ミスタイプのラベルマップ
                    const missTypeLabels: Record<string, string> = {
                      'top': '丸ト',
                      'choro': '丸チ',
                      'duff': '丸ダ',
                      'over': '丸オ',
                      'shank': '丸シ',
                      'pull': '丸ヒ',
                    };

                    // 上位2つのミスタイプを取得（表示制限）
                    const topMissTypes = Object.entries(club.missTypeCounts)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 2);

                    return (
                      <div
                        key={club.club}
                        className="flex items-center justify-between bg-white/50 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          {/* ゴルフクラブアイコン */}
                          <svg
                            className="w-8 h-8 text-[var(--color-neutral-700)] flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                          <div className="text-center">
                            <p className={`${index === 0 ? 'text-sm' : 'text-xs'} text-[var(--color-neutral-600)] leading-tight`}>
                              ワースト
                            </p>
                            <p className={`${index === 0 ? 'text-xl' : 'text-base'} font-bold text-[var(--color-warning-text)] leading-tight`}>
                              {index + 1}位
                            </p>
                          </div>
                          <div>
                            <span className="text-lg font-bold text-[var(--color-neutral-900)]">
                              {club.club}
                            </span>
                            <p className="text-xs text-[var(--color-neutral-600)]">
                              {club.shotCount}ショット
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-2 justify-end">
                            {topMissTypes.map(([missType, count]) => (
                              <div key={missType} className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-[var(--color-warning-text)]">
                                  {missTypeLabels[missType] || missType}
                                </span>
                                <span className="text-lg font-bold text-[var(--color-warning-text)]">
                                  {count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* スペーサー */}
            <div className="h-4"></div>
          </div>
        )}
      </div>
      <PwaInstallBanner needsAdditionalAuth={needsAdditionalAuth} />
      <SettingsGuideModal
        isOpen={showSettingsGuide && !settingsGuideTemporarilyClosed}
        onClose={() => {
          console.log(
            "[Dashboard] Settings guide temporarily closed - will reappear on page reload if not configured"
          );
          setSettingsGuideTemporarilyClosed(true);
        }}
      />
    </Layout>
  );
};