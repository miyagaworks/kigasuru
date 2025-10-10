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
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-3 flex items-center gap-2">
                    <Icon category="ui" name="analysis" size={20} />
                    改善が必要なクラブ（ワースト5）
                  </h3>
                  <div className="space-y-2">
                    {detailedStats.worstClubs.map((clubStat, index) => (
                      <div
                        key={clubStat.club}
                        className="bg-[var(--color-error-border)] border border-[var(--color-secondary-red)] rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-[var(--color-secondary-red)]">
                              #{index + 1}
                            </span>
                            <span className="text-lg font-bold text-[var(--color-neutral-900)]">
                              {clubStat.club}
                            </span>
                          </div>
                          <span className="text-sm text-[var(--color-neutral-600)]">
                            {clubStat.count}ショット
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-[var(--color-neutral-600)]">平均精度</p>
                            <p className="text-xl font-bold text-[var(--color-secondary-red)]">
                              {clubStat.avgAccuracy.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--color-neutral-600)]">平均距離</p>
                            <p className="text-xl font-bold text-[var(--color-neutral-900)]">
                              {clubStat.avgDistance.toFixed(0)}yd
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 全クラブ統計 */}
              <div>
                <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-3">
                  全クラブ統計（精度順）
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--color-neutral-200)]">
                      <tr>
                        <th className="p-3 text-left font-bold text-[var(--color-neutral-900)]">順位</th>
                        <th className="p-3 text-left font-bold text-[var(--color-neutral-900)]">クラブ</th>
                        <th className="p-3 text-right font-bold text-[var(--color-neutral-900)]">ショット数</th>
                        <th className="p-3 text-right font-bold text-[var(--color-neutral-900)]">平均精度</th>
                        <th className="p-3 text-right font-bold text-[var(--color-neutral-900)]">平均距離</th>
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
                                clubStat.avgAccuracy >= 70
                                  ? 'text-[var(--color-primary-green)]'
                                  : clubStat.avgAccuracy >= 50
                                    ? 'text-[var(--color-secondary-orange)]'
                                    : 'text-[var(--color-secondary-red)]'
                              }`}
                            >
                              {clubStat.avgAccuracy.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {clubStat.avgDistance.toFixed(0)}yd
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
