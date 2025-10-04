import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { getAllShots, deleteShot } from '../db';
import { getSlopeDisplayName } from '../sensors/gyro';

/**
 * Round History page - Calendar-based shot history viewer
 */
export const RoundHistoryPage = () => {
  const navigate = useNavigate();
  const [shots, setShots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [roundDates, setRoundDates] = useState(new Set());

  useEffect(() => {
    loadShots();
  }, []);

  const loadShots = async () => {
    try {
      const allShots = await getAllShots();
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

  const handleDeleteShot = async (shotId) => {
    if (window.confirm('このショット記録を削除しますか？')) {
      try {
        await deleteShot(shotId);
        loadShots();
      } catch (error) {
        console.error('Failed to delete shot:', error);
        alert('削除に失敗しました');
      }
    }
  };

  // Get shots for selected date
  const getShotsForDate = (dateStr) => {
    return shots.filter(shot => {
      const shotDate = new Date(shot.date);
      const shotDateStr = `${shotDate.getFullYear()}-${String(shotDate.getMonth() + 1).padStart(2, '0')}-${String(shotDate.getDate()).padStart(2, '0')}`;
      return shotDateStr === dateStr;
    });
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
          .filter(course => course);
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

  const selectedShots = selectedDate ? getShotsForDate(selectedDate) : [];

  // Helper functions for labels
  const getWindLabel = (windData) => {
    if (!windData || windData === 'none') return '無風';
    const parts = windData.split('-');
    const hasStrength = parts[parts.length - 1] === 'weak' || parts[parts.length - 1] === 'strong';
    const direction = hasStrength ? parts.slice(0, -1).join('-') : windData;
    const strength = hasStrength ? parts[parts.length - 1] : '';

    const directionLabels = {
      'up': 'アゲンスト', 'down': 'フォロー', 'left': '左から', 'right': '右から',
      'up-right': '右斜め前', 'down-right': '右斜め後', 'down-left': '左斜め後', 'up-left': '左斜め前',
    };
    const strengthLabels = { 'weak': '弱', 'strong': '強' };
    const dirLabel = directionLabels[direction] || direction;
    const strLabel = strength ? `(${strengthLabels[strength]})` : '';
    return `${dirLabel}${strLabel}`;
  };

  const lieLabels = {
    'a-grade': 'A級', 'good': '良', 'normal': '普通',
    'bad': '悪', 'very-bad': '最悪', 'bunker': 'バンカー',
  };
  const strengthLabels = { 'full': 'フル', 'normal': '抑えめ', 'soft': 'ソフト' };
  const feelingEmoji = { 'great': '😄', 'good': '🙂', 'normal': '😐', 'bad': '😞', 'unsure': '🤔' };

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
              <Icon category="ui" name="back" size={20} />
            </button>
            <h2 className="text-lg font-bold text-[var(--color-neutral-900)]">
              {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-[var(--color-neutral-100)] rounded transition-colors"
            >
              <Icon category="ui" name="next" size={20} />
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
            <h2 className="text-lg font-bold mb-4">
              {new Date(selectedDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} のショット
              <span className="text-sm font-normal text-[var(--color-neutral-600)] ml-2">
                ({selectedShots.length}件)
              </span>
            </h2>

            {selectedShots.length === 0 ? (
              <p className="text-center text-[var(--color-neutral-500)] py-8">
                この日のショット記録はありません
              </p>
            ) : (
              <div className="space-y-3">
                {selectedShots.map((shot, index) => (
                  <div
                    key={shot.id || index}
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
                              yd
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => navigate(`/record?edit=${shot.id}`)}
                            className="p-2 hover:bg-[var(--color-neutral-100)] rounded transition-colors"
                            aria-label="編集"
                          >
                            <Icon category="ui" name="edit" size={20} />
                          </button>
                          <button
                            onClick={() => handleDeleteShot(shot.id)}
                            className="p-2 hover:bg-[var(--color-error-bg)] rounded transition-colors"
                            aria-label="削除"
                          >
                            <Icon category="ui" name="delete" size={20} />
                          </button>
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
