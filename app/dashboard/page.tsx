'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/Layout';
import { getAllShots, type Shot, getSetting } from '@/lib/db';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { SettingsGuideModal } from '@/components/SettingsGuideModal';

interface Statistics {
  count: number;
  avgAccuracy: number;
  mostUsedClub?: string;
}

interface ClubPerformance {
  club: string;
  accuracy: number;
  shotCount: number;
}

interface DistancePerformance {
  range: string;
  label: string;
  accuracy: number;
  shotCount: number;
}

/**
 * Dashboard page - Main entry point after login
 */
export default function DashboardPage() {
  const { data: session } = useSession();
  const [todayStats, setTodayStats] = useState<Statistics | null>(null);
  const [allStats, setAllStats] = useState<Statistics | null>(null);
  const [todayClubPerformance, setTodayClubPerformance] = useState<ClubPerformance[]>([]);
  const [allClubPerformance, setAllClubPerformance] = useState<ClubPerformance[]>([]);
  const [worstClubs, setWorstClubs] = useState<ClubPerformance[]>([]);
  const [distancePerformance, setDistancePerformance] = useState<DistancePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAdditionalAuth, setNeedsAdditionalAuth] = useState(false);
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);
  const [settingsGuideTemporarilyClosed, setSettingsGuideTemporarilyClosed] = useState(false);

  useEffect(() => {
    loadData();
    checkAuthStatus();
  }, []);

  // Check settings status only after session is ready
  useEffect(() => {
    if (session?.user?.id) {
      console.log('[Dashboard] Session ready, checking settings for user:', session.user.id);
      checkSettingsStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // 統計を計算する関数
      const calculateStats = (targetShots: Shot[]): Statistics => {
        if (targetShots.length === 0) {
          return { count: 0, avgAccuracy: 0 };
        }

        // 精度を計算（結果の位置からのズレの平均）
        let avgAccuracy = 0;
        const shotsWithResult = targetShots.filter(shot => shot.result !== null);
        if (shotsWithResult.length > 0) {
          const totalDiff = shotsWithResult.reduce((sum, shot) => {
            // 結果の位置からの距離を計算（ピタゴラスの定理）
            const x = shot.result?.x || 0;
            const y = shot.result?.y || 0;
            const diff = Math.round(Math.sqrt(x * x + y * y));
            return sum + diff;
          }, 0);
          avgAccuracy = Math.round(totalDiff / shotsWithResult.length);
        }

        // 最も使用したクラブを計算
        const clubCounts = targetShots.reduce((acc: Record<string, number>, shot) => {
          acc[shot.club] = (acc[shot.club] || 0) + 1;
          return acc;
        }, {});
        const mostUsedClub = Object.keys(clubCounts).length > 0
          ? Object.keys(clubCounts).reduce((a, b) => clubCounts[a] > clubCounts[b] ? a : b)
          : undefined;

        return {
          count: targetShots.length,
          avgAccuracy,
          mostUsedClub
        };
      };

      // クラブ別パフォーマンスを計算する関数
      const calculateClubPerformance = (targetShots: Shot[]): ClubPerformance[] => {
        const clubData: Record<string, { totalDiff: number; count: number; shotCount: number }> = {};

        targetShots.forEach(shot => {
          if (!clubData[shot.club]) {
            clubData[shot.club] = { totalDiff: 0, count: 0, shotCount: 0 };
          }
          clubData[shot.club].shotCount++;

          if (shot.result !== null) {
            // 結果の位置からの距離を計算
            const x = shot.result.x || 0;
            const y = shot.result.y || 0;
            const diff = Math.round(Math.sqrt(x * x + y * y));
            clubData[shot.club].totalDiff += diff;
            clubData[shot.club].count++;
          }
        });

        return Object.entries(clubData).map(([club, data]) => ({
          club,
          accuracy: data.count > 0 ? Math.round(data.totalDiff / data.count) : 0,
          shotCount: data.shotCount
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

      // 統計を設定
      setTodayStats(calculateStats(todayShots));
      setAllStats(calculateStats(shots));

      // クラブ別パフォーマンスを設定
      const todayPerf = calculateClubPerformance(todayShots);
      const allPerf = calculateClubPerformance(shots);

      setTodayClubPerformance(todayPerf.sort((a, b) => b.shotCount - a.shotCount));
      setAllClubPerformance(allPerf.sort((a, b) => b.shotCount - a.shotCount));

      // ワースト順のクラブを設定（精度が低い順、3回以上使用したクラブのみ）
      setWorstClubs(allPerf.filter(c => c.accuracy > 0 && c.shotCount >= 3).sort((a, b) => b.accuracy - a.accuracy));

      // 距離別パフォーマンスを設定
      setDistancePerformance(calculateDistancePerformance(shots));

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

  return (
    <Layout>
      <div className="p-4">
        {!loading && (
          <div className="space-y-6">
            {/* スペーサー */}
            <div className="h-4"></div>

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
                        className="flex-shrink-0 bg-[var(--color-neutral-100)] rounded-lg p-3 min-w-[100px]"
                      >
                        <p className="text-sm font-bold text-center text-[var(--color-neutral-900)]">
                          {club.club}
                        </p>
                        <p className="text-xl font-bold text-center text-[var(--color-secondary-blue)] mt-1">
                          {club.accuracy}
                        </p>
                        <p className="text-xs text-center text-[var(--color-neutral-500)]">
                          Yd
                        </p>
                        <p className="text-xs text-center text-[var(--color-neutral-600)] mt-1">
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
                        className="flex-shrink-0 bg-[var(--color-neutral-100)] rounded-lg p-3 min-w-[100px]"
                      >
                        <p className="text-sm font-bold text-center text-[var(--color-neutral-900)]">
                          {club.club}
                        </p>
                        <p className="text-xl font-bold text-center text-[var(--color-secondary-blue)] mt-1">
                          {club.accuracy}
                        </p>
                        <p className="text-xs text-center text-[var(--color-neutral-500)]">
                          Yd
                        </p>
                        <p className="text-xs text-center text-[var(--color-neutral-600)] mt-1">
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

            {/* 4. クラブ別精度（ワースト順） */}
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
                  要改善クラブ（精度の低い順）
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