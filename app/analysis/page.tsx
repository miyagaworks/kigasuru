'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { getAllShots, getSetting, type Shot } from '@/lib/db';

const DEFAULT_CLUBS = ['DR', '3W', '5W', '7W', 'U4', 'U5', '5I', '6I', '7I', '8I', '9I', 'PW', '50', '52', '54', '56', '58'];

interface Statistics {
  count: number;
  avgDistance: number;
  shots: Shot[];
  missCount: number;
  missTypeCount: Record<string, number>;
}

/**
 * Analysis page - Data visualization and statistics
 */
function AnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const dateFilter = searchParams.get('date'); // URLから日付パラメータを取得

  const [stats, setStats] = useState<Statistics | null>(null);
  const [clubs, setClubs] = useState(DEFAULT_CLUBS);
  const [golfCourses, setGolfCourses] = useState<string[]>([]);
  const [scatterRange, setScatterRange] = useState(30); // 30yd or 70Yd
  const [enabledFields, setEnabledFields] = useState({
    slope: true,
    lie: true,
    club: true,
    strength: true,
    wind: true,
    temperature: true,
    feeling: true,
    memo: true,
  });
  const [filters, setFilters] = useState<{
    slope: string[];
    club: string[];
    lie: string[];
    strength: string[];
    wind: string[];
    temperature: string[];
    feeling: string[];
    golfCourse: string[];
  }>({
    slope: [],
    club: [],
    lie: [],
    strength: [],
    wind: [],
    temperature: [],
    feeling: [],
    golfCourse: [],
  });
  const [expandedFilters, setExpandedFilters] = useState({
    slope: false,
    club: false,
    lie: false,
    strength: false,
    wind: false,
    temperature: false,
    feeling: false,
    golfCourse: false,
  });
  const [memoListExpanded, setMemoListExpanded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const allShots = await getAllShots();

      // Extract unique golf courses
      const uniqueCourses = [...new Set(
        allShots
          .map(shot => shot.golfCourse)
          .filter((course): course is string => course !== null && course !== '不明')
      )].sort();
      setGolfCourses(uniqueCourses);

      // Apply date filter if present (from URL parameter)
      let dateFilteredShots = allShots;
      if (dateFilter) {
        dateFilteredShots = allShots.filter(shot => {
          const shotDate = new Date(shot.date);
          const shotDateStr = `${shotDate.getFullYear()}-${String(shotDate.getMonth() + 1).padStart(2, '0')}-${String(shotDate.getDate()).padStart(2, '0')}`;
          return shotDateStr === dateFilter;
        });
      }

      // Apply multiple selection filters (OR logic within each category)
      const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

      const filtered = hasActiveFilters
        ? dateFilteredShots.filter(shot => {
            return Object.entries(filters).every(([key, values]) => {
              if (values.length === 0) return true; // No filter for this category

              return values.includes(shot[key as keyof Shot] as string); // Must match one of selected values
            });
          })
        : dateFilteredShots;

      // Calculate statistics for filtered shots
      const distances = filtered.map(s => s.distance).filter((d): d is number => d !== null && d > 0);
      const avgDistance = distances.length > 0
        ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length)
        : 0;

      // Count miss shots
      const missShots = filtered.filter(shot => shot.missType);
      const missTypeCount: Record<string, number> = {};
      missShots.forEach(shot => {
        if (shot.missType) {
          missTypeCount[shot.missType] = (missTypeCount[shot.missType] || 0) + 1;
        }
      });

      setStats({
        count: filtered.length,
        avgDistance,
        shots: filtered, // Keep all filtered shots for scatter plot
        missCount: missShots.length,
        missTypeCount,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [filters, dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load custom clubs and enabled fields on mount
  useEffect(() => {
    const loadSettings = async () => {
      const savedClubs = await getSetting<string[]>('customClubs', DEFAULT_CLUBS);
      setClubs(savedClubs || DEFAULT_CLUBS);

      const savedFields = await getSetting<{
        slope: boolean;
        lie: boolean;
        club: boolean;
        strength: boolean;
        wind: boolean;
        temperature: boolean;
        feeling: boolean;
        memo: boolean;
      }>('enabledInputFields', {
        slope: true,
        lie: true,
        club: true,
        strength: true,
        wind: true,
        temperature: true,
        feeling: true,
        memo: true,
      });
      setEnabledFields(savedFields || {
        slope: true,
        lie: true,
        club: true,
        strength: true,
        wind: true,
        temperature: true,
        feeling: true,
        memo: true,
      });
    };
    loadSettings();
  }, []);

  const toggleFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const current = prev[key];
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: newValues };
    });
  };

  const toggleExpanded = (key: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const clearFilters = () => {
    setFilters({
      slope: [],
      club: [],
      lie: [],
      strength: [],
      wind: [],
      temperature: [],
      feeling: [],
      golfCourse: [],
    });
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  // Convert filter value to Japanese label
  const getFilterLabel = (key: string, value: string) => {
    const labels: Record<string, Record<string, string>> = {
      slope: {
        'flat': '平坦',
        'left-up': '左上がり',
        'left-down': '左下がり',
        'toe-up': 'つま先上がり',
        'toe-down': 'つま先下がり',
        'left-up-toe-up': '左上がり+つま先上がり',
        'left-up-toe-down': '左上がり+つま先下がり',
        'left-down-toe-up': '左下がり+つま先上がり',
        'left-down-toe-down': '左下がり+つま先下がり',
      },
      lie: {
        'a-grade': 'A級',
        'good': '良',
        'normal': '普通',
        'bad': '悪',
        'very-bad': '最悪',
        'bunker': 'バンカー',
      },
      strength: {
        'full': 'フル',
        'normal': '抑えめ',
        'soft': 'ソフト',
      },
      wind: {
        'none': '無風',
        'up': 'アゲンスト',
        'up-weak': 'アゲンスト（弱）',
        'up-strong': 'アゲンスト（強）',
        'down': 'フォロー',
        'down-weak': 'フォロー（弱）',
        'down-strong': 'フォロー（強）',
        'left': '左から',
        'left-weak': '左から（弱）',
        'left-strong': '左から（強）',
        'right': '右から',
        'right-weak': '右から（弱）',
        'right-strong': '右から（強）',
        'up-left': '左斜め前',
        'up-left-weak': '左斜め前（弱）',
        'up-left-strong': '左斜め前（強）',
        'up-right': '右斜め前',
        'up-right-weak': '右斜め前（弱）',
        'up-right-strong': '右斜め前（強）',
        'down-left': '左斜め後',
        'down-left-weak': '左斜め後（弱）',
        'down-left-strong': '左斜め後（強）',
        'down-right': '右斜め後',
        'down-right-weak': '右斜め後（弱）',
        'down-right-strong': '右斜め後（強）',
      },
      temperature: {
        'summer': '夏季',
        'mid-season': '中間期',
        'winter': '冬季',
      },
      feeling: {
        'great': '😄 最高',
        'good': '🙂 良い',
        'normal': '😐 普通',
        'bad': '😞 悪い',
        'unsure': '🤔 微妙',
      },
    };

    return labels[key]?.[value] || value;
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-4 flex items-center gap-2">
          <Icon category="ui" name="analysis" size={28} />
          データ分析
        </h1>

        {/* Date filter controls */}
        {dateFilter && (
          <>
            <button
              onClick={() => {
                router.push(pathname);
              }}
              className="w-full mb-4 px-4 py-3 bg-[var(--color-secondary-blue)] text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Icon category="ui" name="back" size={20} style={{ filter: "brightness(0) invert(1)" }} />
              <span>全期間のデータを表示</span>
            </button>

            <div className="mb-6 p-4 bg-[var(--color-info-bg)] rounded-lg border border-[var(--color-info-border)] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-secondary-blue)] rounded-full flex items-center justify-center">
                  <Icon category="ui" name="calendar" size={20} style={{ filter: "brightness(0) invert(1)" }} />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-info-text)] font-medium">絞り込み期間</p>
                  <p className="text-lg font-bold text-[var(--color-info-text)]">
                    {new Date(dateFilter).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Filters */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">条件フィルタ</h2>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                クリア
              </Button>
            )}
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="mb-3 p-2 bg-[var(--color-success-bg)] rounded-lg border border-[var(--color-success-border)]">
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).flatMap(([key, values]) =>
                  values.map(value => (
                    <span
                      key={`${key}-${value}`}
                      className="px-4 py-1.5 bg-[var(--color-primary-green)] text-white text-xs font-medium rounded-full whitespace-nowrap"
                    >
                      {getFilterLabel(key, value)}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {/* Slope filter - always shown */}
            <div className="border border-[var(--color-neutral-300)] rounded-lg">
              <button
                onClick={() => toggleExpanded('slope')}
                className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-neutral-100)] transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--color-neutral-900)]">傾斜</span>
                  {filters.slope.length > 0 && (
                    <span className="px-2 py-0.5 bg-[var(--color-primary-green)] text-white text-xs rounded-full">
                      {filters.slope.length}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-[var(--color-neutral-600)] transition-transform ${expandedFilters.slope ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFilters.slope && (
                <div className="p-3 pt-0 border-t border-[var(--color-neutral-200)]">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'flat', label: '平坦' },
                  { value: 'left-up', label: '左足上がり' },
                  { value: 'left-down', label: '左足下がり' },
                  { value: 'toe-up', label: 'つま先上がり' },
                  { value: 'toe-down', label: 'つま先下がり' },
                  { value: 'left-up-toe-up', label: '左上+つま上' },
                  { value: 'left-up-toe-down', label: '左上+つま下' },
                  { value: 'left-down-toe-up', label: '左下+つま上' },
                  { value: 'left-down-toe-down', label: '左下+つま下' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.slope.includes(value)}
                      onChange={() => toggleFilter('slope', value)}
                      className="w-4 h-4 text-[var(--color-primary-green)] rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
                </div>
              )}
            </div>

            {/* Club filter - always shown */}
            <div className="border border-[var(--color-neutral-300)] rounded-lg">
              <button
                onClick={() => toggleExpanded('club')}
                className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-neutral-100)] transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--color-neutral-900)]">クラブ</span>
                  {filters.club.length > 0 && (
                    <span className="px-2 py-0.5 bg-[var(--color-primary-green)] text-white text-xs rounded-full">
                      {filters.club.length}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-[var(--color-neutral-600)] transition-transform ${expandedFilters.club ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFilters.club && (
                <div className="p-3 pt-0 border-t border-[var(--color-neutral-200)]">
              <div className="grid grid-cols-4 gap-2">
                {clubs.map((club) => (
                  <label key={club} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.club.includes(club)}
                      onChange={() => toggleFilter('club', club)}
                      className="w-4 h-4 text-[var(--color-primary-green)] rounded"
                    />
                    <span className="text-sm">{club}</span>
                  </label>
                ))}
              </div>
                </div>
              )}
            </div>

            {/* Lie filter */}
            {enabledFields.lie && (
              <div className="border border-[var(--color-neutral-300)] rounded-lg">
                <button
                  onClick={() => toggleExpanded('lie')}
                  className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-neutral-100)] transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-neutral-900)]">ライ</span>
                    {filters.lie.length > 0 && (
                      <span className="px-2 py-0.5 bg-[var(--color-primary-green)] text-white text-xs rounded-full">
                        {filters.lie.length}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-[var(--color-neutral-600)] transition-transform ${expandedFilters.lie ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFilters.lie && (
                  <div className="p-3 pt-0 border-t border-[var(--color-neutral-200)]">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'a-grade', label: 'A級' },
                  { value: 'good', label: '良' },
                  { value: 'normal', label: '普通' },
                  { value: 'bad', label: '悪' },
                  { value: 'very-bad', label: '最悪' },
                  { value: 'bunker', label: 'バンカー' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.lie.includes(value)}
                      onChange={() => toggleFilter('lie', value)}
                      className="w-4 h-4 text-[var(--color-primary-green)] rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
                  </div>
                )}
              </div>
            )}

            {/* Strength filter */}
            {enabledFields.strength && (
              <div className="border border-[var(--color-neutral-300)] rounded-lg">
                <button
                  onClick={() => toggleExpanded('strength')}
                  className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-neutral-100)] transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-neutral-900)]">強度</span>
                    {filters.strength.length > 0 && (
                      <span className="px-2 py-0.5 bg-[var(--color-primary-green)] text-white text-xs rounded-full">
                        {filters.strength.length}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-[var(--color-neutral-600)] transition-transform ${expandedFilters.strength ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFilters.strength && (
                  <div className="p-3 pt-0 border-t border-[var(--color-neutral-200)]">
              <div className="flex gap-4">
                {[
                  { value: 'full', label: 'フル' },
                  { value: 'normal', label: '抑えめ' },
                  { value: 'soft', label: 'ソフト' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.strength.includes(value)}
                      onChange={() => toggleFilter('strength', value)}
                      className="w-4 h-4 text-[var(--color-primary-green)] rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
                  </div>
                )}
              </div>
            )}

            {/* Wind filter */}
            {enabledFields.wind && (
              <div className="border border-[var(--color-neutral-300)] rounded-lg">
                <button
                  onClick={() => toggleExpanded('wind')}
                  className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-neutral-100)] transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-neutral-900)]">風向き</span>
                    {filters.wind.length > 0 && (
                      <span className="px-2 py-0.5 bg-[var(--color-primary-green)] text-white text-xs rounded-full">
                        {filters.wind.length}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-[var(--color-neutral-600)] transition-transform ${expandedFilters.wind ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFilters.wind && (
                  <div className="p-3 pt-0 border-t border-[var(--color-neutral-200)]">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'none', label: '無風' },
                  { value: 'up', label: 'アゲンスト' },
                  { value: 'up-weak', label: 'アゲンスト（弱）' },
                  { value: 'up-strong', label: 'アゲンスト（強）' },
                  { value: 'down', label: 'フォロー' },
                  { value: 'down-weak', label: 'フォロー（弱）' },
                  { value: 'down-strong', label: 'フォロー（強）' },
                  { value: 'left', label: '左から' },
                  { value: 'left-weak', label: '左から（弱）' },
                  { value: 'left-strong', label: '左から（強）' },
                  { value: 'right', label: '右から' },
                  { value: 'right-weak', label: '右から（弱）' },
                  { value: 'right-strong', label: '右から（強）' },
                  { value: 'up-left', label: '左斜め前' },
                  { value: 'up-left-weak', label: '左斜め前（弱）' },
                  { value: 'up-left-strong', label: '左斜め前（強）' },
                  { value: 'up-right', label: '右斜め前' },
                  { value: 'up-right-weak', label: '右斜め前（弱）' },
                  { value: 'up-right-strong', label: '右斜め前（強）' },
                  { value: 'down-left', label: '左斜め後' },
                  { value: 'down-left-weak', label: '左斜め後（弱）' },
                  { value: 'down-left-strong', label: '左斜め後（強）' },
                  { value: 'down-right', label: '右斜め後' },
                  { value: 'down-right-weak', label: '右斜め後（弱）' },
                  { value: 'down-right-strong', label: '右斜め後（強）' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.wind.includes(value)}
                      onChange={() => toggleFilter('wind', value)}
                      className="w-4 h-4 text-[var(--color-primary-green)] rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
                  </div>
                )}
              </div>
            )}

            {/* Temperature filter */}
            {enabledFields.temperature && (
              <div className="border border-[var(--color-neutral-300)] rounded-lg">
                <button
                  onClick={() => toggleExpanded('temperature')}
                  className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-neutral-100)] transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-neutral-900)]">気温</span>
                    {filters.temperature.length > 0 && (
                      <span className="px-2 py-0.5 bg-[var(--color-primary-green)] text-white text-xs rounded-full">
                        {filters.temperature.length}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-[var(--color-neutral-600)] transition-transform ${expandedFilters.temperature ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFilters.temperature && (
                  <div className="p-3 pt-0 border-t border-[var(--color-neutral-200)]">
              <div className="flex gap-4">
                {[
                  { value: 'summer', label: '夏季' },
                  { value: 'mid-season', label: '中間期' },
                  { value: 'winter', label: '冬季' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.temperature.includes(value)}
                      onChange={() => toggleFilter('temperature', value)}
                      className="w-4 h-4 text-[var(--color-primary-green)] rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
                  </div>
                )}
              </div>
            )}

            {/* Golf Course filter */}
            {golfCourses.length > 0 && (
              <div className="border border-[var(--color-neutral-300)] rounded-lg">
                <button
                  onClick={() => toggleExpanded('golfCourse')}
                  className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-neutral-100)] transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-neutral-900)]">ゴルフ場</span>
                    {filters.golfCourse.length > 0 && (
                      <span className="px-2 py-0.5 bg-[var(--color-primary-green)] text-white text-xs rounded-full">
                        {filters.golfCourse.length}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-[var(--color-neutral-600)] transition-transform ${expandedFilters.golfCourse ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFilters.golfCourse && (
                  <div className="p-3 pt-0 border-t border-[var(--color-neutral-200)]">
                <div className="grid grid-cols-2 gap-2">
                  {golfCourses.map((course) => (
                    <label key={course} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.golfCourse.includes(course)}
                        onChange={() => toggleFilter('golfCourse', course)}
                        className="w-4 h-4 text-[var(--color-primary-green)] rounded"
                      />
                      <span className="text-sm truncate">{course}</span>
                    </label>
                  ))}
                </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats cards */}
        {stats ? (
          <div className="space-y-4 mb-6">
            <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">統計情報</h2>
                {hasActiveFilters && (
                  <span className="text-xs text-[var(--color-neutral-600)]">
                    フィルタ適用中
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--color-neutral-600)]">ショット数</p>
                  <p className="text-3xl font-bold text-[var(--color-primary-green)]">
                    {stats.count}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-neutral-600)]">平均飛距離</p>
                  <p className="text-3xl font-bold text-[var(--color-secondary-blue)]">
                    {stats.avgDistance}y
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">結果分布</h2>
                {/* Range toggle */}
                <div className="flex items-center gap-2 bg-[var(--color-neutral-100)] rounded-lg p-1">
                  <button
                    onClick={() => setScatterRange(30)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      scatterRange === 30
                        ? 'bg-[var(--color-primary-green)] text-white'
                        : 'text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-200)]'
                    }`}
                  >
                    拡大 (30Yd)
                  </button>
                  <button
                    onClick={() => setScatterRange(70)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      scatterRange === 70
                        ? 'bg-[var(--color-primary-green)] text-white'
                        : 'text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-200)]'
                    }`}
                  >
                    全体 (70Yd)
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <svg
                  width="300"
                  height="300"
                  viewBox="-34 -42 368 375"
                  style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
                >
                  {/* 円形の背景（円の内側のみ） */}
                  <circle cx="150" cy="150" r="182" fill="var(--color-card-bg)" />

                  {scatterRange === 70 ? (
                    <>
                      {/* 70Yd表示: 同心円（10ヤード刻みで70ヤードまで） */}
                      <circle cx="150" cy="150" r="26" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="52" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="78" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="104" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="130" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="156" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="182" fill="none" stroke="var(--color-neutral-400)" strokeWidth="2" />
                    </>
                  ) : (
                    <>
                      {/* 30Yd表示: 5ヤード刻みで30ヤードまで */}
                      <circle cx="150" cy="150" r="30" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="61" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="91" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="121" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="152" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                      <circle cx="150" cy="150" r="182" fill="none" stroke="var(--color-neutral-400)" strokeWidth="2" />
                    </>
                  )}

                  {/* 十字線 */}
                  <line x1="150" y1="-32" x2="150" y2="332" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.3" />
                  <line x1="-32" y1="150" x2="332" y2="150" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.3" />

                  {/* 距離ラベル（上が飛球方向） */}
                  {scatterRange === 70 ? (
                    <>
                      <text x="150" y="128" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">10Yd</text>
                      <text x="150" y="102" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">20Yd</text>
                      <text x="150" y="76" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">30Yd</text>
                      <text x="150" y="50" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">40Yd</text>
                      <text x="150" y="24" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">50Yd</text>
                      <text x="150" y="-2" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">60Yd</text>
                      <text x="150" y="-28" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">70Yd</text>
                    </>
                  ) : (
                    <>
                      <text x="150" y="124" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">5Yd</text>
                      <text x="150" y="93" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">10Yd</text>
                      <text x="150" y="63" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">15Yd</text>
                      <text x="150" y="32" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">20Yd</text>
                      <text x="150" y="2" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">25Yd</text>
                      <text x="150" y="-28" textAnchor="middle" fontSize="12" fill="var(--color-neutral-600)" stroke="var(--color-card-bg)" strokeWidth="3" paintOrder="stroke">30Yd</text>
                    </>
                  )}

                  {/* 中心のターゲット（赤い丸） */}
                  <circle cx="150" cy="150" r="8" fill="#b31630" />

                  {/* Plot shot results */}
                  {(() => {
                    // 通常のショット（位置記録があるもの）
                    const normalShots = stats.shots.filter((shot): shot is Shot & { result: { x: number; y: number } } => {
                      if (!shot.result || typeof shot.result !== 'object' || shot.result.x === undefined) {
                        return false;
                      }
                      if (scatterRange === 30) {
                        return Math.abs(shot.result.x) <= 30 && Math.abs(shot.result.y) <= 30;
                      }
                      return true;
                    });

                    return normalShots.map((shot, index) => {
                      const scale = scatterRange === 70 ? 182 / 70 : 182 / 30;
                      const plotX = 150 + (shot.result.x * scale);
                      const plotY = 150 - (shot.result.y * scale);
                      return (
                        <circle
                          key={`normal-${shot.id || index}`}
                          cx={plotX}
                          cy={plotY}
                          r="6"
                          fill="var(--color-primary-green)"
                          opacity="0.7"
                        />
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>

            {/* Miss shots statistics */}
            {stats.missCount > 0 && stats.missTypeCount && (
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold mb-4">ミスショット</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.missTypeCount).map(([type, count]) => {
                    const labels: Record<string, string> = {
                      'top': 'トップ',
                      'choro': 'チョロ',
                      'duff': 'ダフリ',
                      'over': '大オーバー',
                      'shank': 'シャンク',
                      'pull': 'ひっかけ',
                    };
                    return (
                      <span
                        key={type}
                        className="px-4 py-2 bg-[var(--color-secondary-red)] text-white text-sm font-medium rounded-full"
                      >
                        {labels[type] || type}：{count}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Memo list */}
            {stats.shots.filter(shot => shot.memo).length > 0 && (
              <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
                <button
                  onClick={() => setMemoListExpanded(!memoListExpanded)}
                  className="w-full flex items-center justify-between mb-4 hover:opacity-70 transition-opacity"
                >
                  <h2 className="text-lg font-bold">メモ一覧 ({stats.shots.filter(shot => shot.memo).length}件)</h2>
                  <svg
                    className={`w-5 h-5 text-[var(--color-neutral-600)] transition-transform ${memoListExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {memoListExpanded && (
                  <div className="space-y-3">
                    {stats.shots
                      .filter(shot => shot.memo)
                      .map((shot, index) => (
                        <div
                          key={shot.id || index}
                          className="p-4 bg-[var(--color-muted-bg)] rounded-lg border border-[var(--color-muted-border)]"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-bold text-[var(--color-neutral-900)]">{shot.club}</span>
                              <span className="text-sm text-[var(--color-neutral-600)] ml-2">{shot.distance}Yd</span>
                            </div>
                            <span className="text-xs text-[var(--color-neutral-500)]">
                              {new Date(shot.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--color-neutral-700)] whitespace-pre-wrap">{shot.memo}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-6">
            <div className="text-center py-12">
              <Icon category="ui" name="analysis" size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-[var(--color-neutral-600)]">まだデータがありません</p>
              <p className="text-xs text-[var(--color-neutral-500)] mt-2">
                ショットを記録すると統計が表示されます
              </p>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">読み込み中...</div>
        </div>
      </Layout>
    }>
      <AnalysisContent />
    </Suspense>
  );
}
