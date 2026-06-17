'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/Layout';
import { Icon } from '@/components/Icon';
import { getAllShots, deleteShot, getShot, initDB, type Shot } from '@/lib/db';
import { getSlopeDisplayName } from '@/lib/sensors/gyro';
import { IoMdArrowRoundForward, IoMdArrowRoundBack } from 'react-icons/io';

/**
 * Round History page - Calendar-based shot history viewer
 */
export default function RoundHistoryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [shots, setShots] = useState<Shot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [roundDates, setRoundDates] = useState<Set<string>>(new Set());
  const [selectedShots, setSelectedShots] = useState<Shot[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user can delete shots (not trial users)
  const canDeleteShots = session?.user?.subscriptionStatus !== 'trial';

  // Get shots for selected date
  const getShotsForDate = useCallback((dateStr: string) => {
    return shots.filter(shot => {
      const shotDate = new Date(shot.date);
      const shotDateStr = `${shotDate.getFullYear()}-${String(shotDate.getMonth() + 1).padStart(2, '0')}-${String(shotDate.getDate()).padStart(2, '0')}`;
      return shotDateStr === dateStr;
    });
  }, [shots]);

  useEffect(() => {
    if (session?.user?.id) {
      initDB(session.user.id);   // 冪等（同ユーザーは既存DBを返す）。履歴表示前にユーザーDBを保証
      loadShots(true);           // 最新を IndexedDB から直接読む（30秒キャッシュをスキップ）
    }
  }, [session?.user?.id]);

  // Update selectedShots when shots or selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const shotsForDate = getShotsForDate(selectedDate);
      setSelectedShots(shotsForDate);
    } else {
      setSelectedShots([]);
    }
  }, [shots, selectedDate, getShotsForDate]);

  const loadShots = async (skipCache = false) => {
    try {
      const allShots = await getAllShots(skipCache);
      setShots(allShots);

      // Extract unique dates where shots were recorded
      const dates = new Set(
        allShots.map(shot => {
          const date = new Date(shot.date);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        })
      );
      setRoundDates(dates);
    } catch (error) {
      console.error('Failed to load shots:', error);
    }
  };

  const handleDeleteShot = async (shotId: number) => {
    if (isDeleting) return; // Prevent multiple deletions at once

    if (window.confirm('このショット記録を削除しますか？')) {
      try {
        setIsDeleting(true);
        console.log('[History] Starting deletion for shot:', shotId);

        // Get shot details to find serverId
        const shot = await getShot(shotId);
        console.log('[History] Shot details:', { id: shotId, serverId: shot?.serverId });

        // Delete from IndexedDB first
        await deleteShot(shotId);
        console.log('[History] Shot deleted from IndexedDB');

        // Delete from server (if online and has serverId)
        if (shot?.serverId && typeof navigator !== 'undefined' && navigator.onLine) {
          console.log('[History] Attempting to delete from server:', shot.serverId);
          try {
            const response = await fetch(`/api/shots/${shot.serverId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            console.log('[History] Server response:', response.status, response.statusText);

            if (!response.ok) {
              const errorText = await response.text();
              console.error('[History] Server deletion failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
              });
              // Continue anyway - IndexedDB deletion was successful
            } else {
              console.log('[History] Shot successfully deleted from server:', shot.serverId);
            }
          } catch (error) {
            console.error('[History] Server deletion error:', error);
            // Continue anyway - IndexedDB deletion was successful
          }
        } else {
          console.log('[History] Skipping server deletion:', {
            hasServerId: !!shot?.serverId,
            isOnline: navigator.onLine
          });
        }

        // Reload shots to update UI
        console.log('[History] Reloading shots...');
        await loadShots();
        console.log('[History] Deletion complete');
      } catch (error) {
        console.error('[History] Failed to delete shot:', error);
        alert('削除に失敗しました: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Calendar rendering
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasRound = roundDates.has(dateStr);
      const isSelected = selectedDate === dateStr;

      // Get golf course name for this date
      let golfCourseName = '';
      if (hasRound) {
        const dayShots = getShotsForDate(dateStr);
        const coursesOnDay = dayShots
          .map(shot => shot.golfCourse)
          .filter((course): course is string => course !== null && course !== '');
        if (coursesOnDay.length > 0) {
          golfCourseName = coursesOnDay[0];
        }
      }

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors relative p-1
            ${hasRound ? 'bg-[var(--color-primary-green)] text-white hover:bg-[var(--color-primary-dark)]' :
              'bg-[var(--color-card-bg)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]'}
            ${isSelected ? 'ring-2 ring-[var(--color-secondary-blue)] ring-offset-2' : ''}
          `}
        >
          <span className="text-sm font-bold">{day}</span>
          {golfCourseName && (
            <span className="text-[8px] leading-tight truncate w-full text-center mt-0.5 opacity-90">
              {golfCourseName}
            </span>
          )}
        </button>
      );
    }

    return days;
  };

  // Helper functions for labels
  const getWindLabel = (windData: string | null) => {
    if (!windData || windData === 'none') return '無風';
    const parts = windData.split('-');
    const hasStrength = parts[parts.length - 1] === 'weak' || parts[parts.length - 1] === 'strong';
    const direction = hasStrength ? parts.slice(0, -1).join('-') : windData;
    const strength = hasStrength ? parts[parts.length - 1] : '';

    const directionLabels: Record<string, string> = {
      'up': 'アゲンスト', 'down': 'フォロー', 'left': '左から', 'right': '右から',
      'up-right': '右斜め前', 'down-right': '右斜め後', 'down-left': '左斜め後', 'up-left': '左斜め前',
    };
    const strengthLabels: Record<string, string> = { 'weak': '弱', 'strong': '強' };
    const dirLabel = directionLabels[direction] || direction;
    const strLabel = strength ? `(${strengthLabels[strength]})` : '';
    return `${dirLabel}${strLabel}`;
  };

  const lieLabels: Record<string, string> = {
    'a-grade': 'A級', 'good': '良', 'normal': '普通',
    'bad': '悪', 'very-bad': '最悪', 'bunker': 'バンカー',
  };
  const strengthLabels: Record<string, string> = { 'full': 'フル', 'normal': '抑えめ', 'soft': 'ソフト' };
  const feelingEmoji: Record<string, string> = { 'great': '😄', 'good': '🙂', 'normal': '😐', 'bad': '😞', 'unsure': '🤔' };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-6 flex items-center gap-2">
          <Icon category="ui" name="calendar" size={28} />
          ラウンド履歴
        </h1>

        {/* Calendar */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-[var(--color-neutral-100)] rounded transition-colors"
            >
              <IoMdArrowRoundBack size={20} />
            </button>
            <h2 className="text-lg font-bold text-[var(--color-neutral-900)]">
              {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-[var(--color-neutral-100)] rounded transition-colors"
            >
              <IoMdArrowRoundForward size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['日', '月', '火', '水', '木', '金', '土'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-[var(--color-neutral-600)]">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>

        {/* Selected date shots */}
        {selectedDate && (
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-3">
              {new Date(selectedDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} のショット
              <span className="text-sm font-normal text-[var(--color-neutral-600)] ml-2">
                ({selectedShots.length}件)
              </span>
            </h2>

            {selectedShots.length > 0 && (
              <button
                onClick={() => router.push(`/analysis?date=${selectedDate}`)}
                className="w-full mb-4 px-4 py-3 bg-[var(--color-secondary-blue)] text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Icon category="ui" name="analysis" size={24} style={{ filter: "brightness(0) invert(1)" }} />
                <span className="text-base">この日の分析</span>
              </button>
            )}

            {selectedShots.length === 0 ? (
              <p className="text-center text-[var(--color-neutral-500)] py-8">
                この日のショット記録はありません
              </p>
            ) : (
              <div className="space-y-3">
                {selectedShots.map((shot) => (
                  <div
                    key={shot.id}
                    className="bg-[var(--color-card-bg)] rounded-lg p-4 border border-[var(--color-neutral-300)]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-lg text-[var(--color-neutral-900)]">
                          {shot.club}
                        </p>
                        <p className="text-sm text-[var(--color-neutral-600)] mt-1">
                          {getSlopeDisplayName(shot.slope)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[var(--color-primary-green)]">
                            {shot.distance}
                            <span className="text-sm font-normal text-[var(--color-neutral-600)] ml-1">
                              Yd
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => router.push(`/record?edit=${shot.id}`)}
                            className="p-2 hover:bg-[var(--color-neutral-100)] rounded transition-colors"
                            aria-label="編集"
                            disabled={isDeleting}
                          >
                            <Icon category="ui" name="edit" size={20} />
                          </button>
                          {canDeleteShots && (
                            <button
                              onClick={() => handleDeleteShot(shot.id!)}
                              className="p-2 hover:bg-[var(--color-error-bg)] rounded transition-colors disabled:opacity-50"
                              aria-label="削除"
                              disabled={isDeleting}
                            >
                              <Icon category="ui" name="delete" size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-neutral-200)]">
                      <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-600)]">
                        <span>{lieLabels[shot.lie] || shot.lie}</span>
                        <span>•</span>
                        <span>{strengthLabels[shot.strength] || shot.strength}</span>
                        <span>•</span>
                        <span>{getWindLabel(shot.wind)}</span>
                      </div>
                      {shot.feeling && (
                        <span className="text-lg">
                          {feelingEmoji[shot.feeling] || ''}
                        </span>
                      )}
                    </div>
                    {shot.result && typeof shot.result === 'object' && (
                      <div className="mt-2 text-xs text-[var(--color-neutral-500)]">
                        {shot.result.x > 0 ? '右' : shot.result.x < 0 ? '左' : ''}
                        {Math.abs(shot.result.x).toFixed(1)}y,
                        {shot.result.y > 0 ? 'オーバー' : shot.result.y < 0 ? 'ショート' : 'ジャスト'}
                        {Math.abs(shot.result.y).toFixed(1)}y
                      </div>
                    )}
                    {shot.golfCourse && (
                      <div className="mt-2 text-xs text-[var(--color-neutral-500)]">
                        📍 {shot.golfCourse}
                      </div>
                    )}
                    {shot.memo && (
                      <div className="mt-2 p-2 bg-[var(--color-muted-bg)] rounded border border-[var(--color-muted-border)]">
                        <p className="text-xs font-medium text-[var(--color-muted-text)] mb-1">📝 メモ</p>
                        <p className="text-xs text-[var(--color-neutral-700)] whitespace-pre-wrap">{shot.memo}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
