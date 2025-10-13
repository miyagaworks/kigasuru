'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

interface ClubStats {
  club: string;
  count: number;
  avgDistance: number;
  avgAccuracy: number;
  shots: Array<{ distance: number; accuracy: number; date: Date }>;
}

interface DetailedStats {
  allClubStats: ClubStats[];
  worstClubs: ClubStats[];
  totalShots: number;
}

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string | null;
  userEmail: string;
}

export function UserDetailModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
}: UserDetailModalProps) {
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadDetailedStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?detailUserId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDetailedStats(data.detailedStats);
      }
    } catch (error) {
      console.error('Failed to load detailed stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadDetailedStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[var(--color-bg-main)] rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-bg-main)] border-b border-[var(--color-neutral-300)] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-neutral-900)]">
              詳細統計
            </h2>
            <p className="text-sm text-[var(--color-neutral-600)] mt-1">
              {userName || '名前なし'} ({userEmail})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-neutral-200)] rounded-lg transition-colors"
          >
            <Icon category="ui" name="close" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-green)]"></div>
                <p className="mt-4 text-[var(--color-neutral-700)]">読み込み中...</p>
              </div>
            </div>
          ) : detailedStats ? (
            <div className="space-y-6">
              {/* サマリー */}
              <div className="bg-[var(--color-neutral-100)] rounded-lg p-4">
                <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-2">
                  統計サマリー
                </h3>
                <p className="text-sm text-[var(--color-neutral-700)]">
                  総ショット数: <span className="font-bold text-[var(--color-primary-green)]">{detailedStats.totalShots}</span>
                </p>
                <p className="text-sm text-[var(--color-neutral-700)]">
                  使用クラブ数: <span className="font-bold text-[var(--color-secondary-blue)]">{detailedStats.allClubStats.length}</span>
                </p>
              </div>

              {/* ワースト5クラブ */}
              {detailedStats.worstClubs.length > 0 && (
                <div className="bg-[var(--color-error-bg)] rounded-lg shadow-md p-4 border-l-4 border-[var(--color-error-text)]">
                  <h3 className="text-lg font-bold text-[var(--color-error-text)] mb-4 flex items-center gap-2">
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
                  </h3>
                  <div className="space-y-2">
                    {detailedStats.worstClubs.map((clubStat, index) => (
                      <div
                        key={clubStat.club}
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
                              {clubStat.club}
                            </span>
                            <p className="text-xs text-[var(--color-neutral-600)]">
                              {clubStat.count}ショット
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-neutral-600)] mb-1">
                            平均精度
                          </p>
                          <p className="font-bold text-[var(--color-secondary-red)]">
                            {clubStat.avgAccuracy} Yd
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 全クラブ統計 */}
              <div>
                <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-3">
                  全クラブ統計（精度が良い順）
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--color-neutral-200)]">
                      <tr>
                        <th className="p-3 text-left font-bold text-[var(--color-neutral-900)]">順位</th>
                        <th className="p-3 text-left font-bold text-[var(--color-neutral-900)]">クラブ</th>
                        <th className="p-3 text-right font-bold text-[var(--color-neutral-900)]">ショット数</th>
                        <th className="p-3 text-right font-bold text-[var(--color-neutral-900)]">平均精度</th>
                        <th className="p-3 text-right font-bold text-[var(--color-neutral-900)]">平均飛距離</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedStats.allClubStats.map((clubStat, index) => (
                        <tr
                          key={clubStat.club}
                          className={`border-b border-[var(--color-neutral-300)] ${
                            index < 3 ? 'bg-green-50' : index >= detailedStats.allClubStats.length - 3 ? 'bg-red-50' : ''
                          }`}
                        >
                          <td className="p-3 font-bold">{index + 1}</td>
                          <td className="p-3 font-bold">{clubStat.club}</td>
                          <td className="p-3 text-right">{clubStat.count}</td>
                          <td className="p-3 text-right">
                            <span
                              className={`font-bold ${
                                index < 3
                                  ? 'text-[var(--color-primary-green)]'
                                  : index >= detailedStats.allClubStats.length - 3
                                    ? 'text-[var(--color-secondary-red)]'
                                    : 'text-[var(--color-neutral-900)]'
                              }`}
                            >
                              {clubStat.avgAccuracy}Yd
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-[var(--color-primary-green)]">
                            {clubStat.avgDistance}Yd
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--color-neutral-600)]">
                データがありません
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--color-bg-main)] border-t border-[var(--color-neutral-300)] p-6">
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full"
          >
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}
