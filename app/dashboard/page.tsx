'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/Layout';
import { getAllShots, type Shot, getSetting } from '@/lib/db';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { SettingsGuideModal } from '@/components/SettingsGuideModal';

interface Statistics {
  count: number;
  avgDistance: number;
  avgAccuracy: number;
  mostUsedClub?: string;
}

interface ClubPerformance {
  club: string;
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
          return { count: 0, avgDistance: 0, avgAccuracy: 0 };
        }

        // 平均飛距離を計算
        const totalDistance = targetShots.reduce((sum, shot) => sum + (shot.distance || 0), 0);
        const avgDistance = Math.round(totalDistance / targetShots.length);

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
          avgDistance,
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

            {/* 1. 今日のラウンドサマリー */}
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
                今日のラウンドサマリー
              </h2>
              {todayStats && todayStats.count > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                      ショット数
                    </p>
                    <p className="text-2xl font-bold text-[var(--color-primary-green)]">
                      {todayStats.count}
                    </p>
                  </div>
                  <div className="text-center border-x border-[var(--color-neutral-300)]">
                    <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                      平均精度
                    </p>
                    <p className="text-2xl font-bold text-[var(--color-secondary-blue)]">
                      {todayStats.avgAccuracy}
                    </p>
                    <p className="text-xs text-[var(--color-neutral-500)]">
                      ヤード
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                      最多使用
                    </p>
                    <p className="text-2xl font-bold text-[var(--color-neutral-900)]">
                      {todayStats.mostUsedClub || "-"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-[var(--color-neutral-600)] py-4">
                  今日のデータはありません
                </p>
              )}
            </div>

            {/* 2. 全てのラウンドサマリー */}
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
                全ラウンドサマリー
              </h2>
              {allStats && allStats.count > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                      ショット数
                    </p>
                    <p className="text-2xl font-bold text-[var(--color-primary-green)]">
                      {allStats.count}
                    </p>
                  </div>
                  <div className="text-center border-x border-[var(--color-neutral-300)]">
                    <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                      平均精度
                    </p>
                    <p className="text-2xl font-bold text-[var(--color-secondary-blue)]">
                      {allStats.avgAccuracy}
                    </p>
                    <p className="text-xs text-[var(--color-neutral-500)]">
                      ヤード
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                      最多使用
                    </p>
                    <p className="text-2xl font-bold text-[var(--color-neutral-900)]">
                      {allStats.mostUsedClub || "-"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-[var(--color-neutral-600)] py-4">
                  データがありません
                </p>
              )}
            </div>

            {/* 3. 今日のクラブ別パフォーマンス */}
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
                          ヤード
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

            {/* 4. 全期間のクラブ別パフォーマンス */}
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
                          ヤード
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

            {/* 5. クラブ別精度（ワースト順） */}
            {worstClubs.length > 0 && (
              <div className="bg-[var(--color-error-bg)] rounded-lg shadow-md p-4 border border-[var(--color-error-border)]">
                <h2 className="text-lg font-bold text-[var(--color-error-text)] mb-4">
                  要改善クラブ（精度の低い順）
                </h2>
                <div className="space-y-2">
                  {worstClubs.slice(0, 5).map((club, index) => (
                    <div
                      key={club.club}
                      className="flex items-center justify-between bg-white/50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1">
                          {index < 3 ? (
                            <svg
                              width="20"
                              height="20"
                              fill="none"
                              stroke="currentColor"
                              className="text-[var(--color-secondary-red)]"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          ) : (
                            <svg
                              width="20"
                              height="20"
                              fill="none"
                              stroke="currentColor"
                              className="text-[var(--color-secondary-orange)]"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          <span
                            className={`text-2xl font-bold ${index < 3 ? "text-[var(--color-secondary-red)]" : "text-[var(--color-secondary-orange)]"}`}
                          >
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-[var(--color-neutral-900)]">
                          {club.club}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[var(--color-secondary-red)]">
                          平均 {club.accuracy} ヤード
                        </p>
                        <p className="text-xs text-[var(--color-neutral-600)]">
                          のズレ（{club.shotCount}ショット）
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
          console.log('[Dashboard] Settings guide temporarily closed - will reappear on page reload if not configured');
          setSettingsGuideTemporarilyClosed(true);
        }}
      />
    </Layout>
  );
};