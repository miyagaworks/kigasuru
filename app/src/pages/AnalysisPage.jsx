import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { getAllShots, getSetting } from '../db';

const DEFAULT_CLUBS = ['DR', '3W', '5W', '7W', 'U4', 'U5', '5I', '6I', '7I', '8I', '9I', 'PW', '50', '52', '54', '56', '58'];

/**
 * Analysis page - Data visualization and statistics
 */
export const AnalysisPage = () => {
  const [stats, setStats] = useState(null);
  const [clubs, setClubs] = useState(DEFAULT_CLUBS);
  const [golfCourses, setGolfCourses] = useState([]);
  const [scatterRange, setScatterRange] = useState(30); // 30yd or 70yd
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
  const [filters, setFilters] = useState({
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
          .filter(course => course && course !== '不明')
      )].sort();
      setGolfCourses(uniqueCourses);

      // Apply multiple selection filters (OR logic within each category)
      const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

      const filtered = hasActiveFilters
        ? allShots.filter(shot => {
            return Object.entries(filters).every(([key, values]) => {
              if (values.length === 0) return true; // No filter for this category

              return values.includes(shot[key]); // Must match one of selected values
            });
          })
        : allShots;

      // Calculate statistics for filtered shots
      const distances = filtered.map(s => s.distance).filter(d => d > 0);
      const avgDistance = distances.length > 0
        ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length)
        : 0;

      // Count miss shots
      const missShots = filtered.filter(shot => shot.missType);
      const missTypeCount = {};
      missShots.forEach(shot => {
        missTypeCount[shot.missType] = (missTypeCount[shot.missType] || 0) + 1;
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
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load custom clubs and enabled fields on mount
  useEffect(() => {
    const loadSettings = async () => {
      const savedClubs = await getSetting('customClubs', DEFAULT_CLUBS);
      setClubs(savedClubs);

      const savedFields = await getSetting('enabledInputFields', {
        slope: true,
        lie: true,
        club: true,
        strength: true,
        wind: true,
        temperature: true,
        feeling: true,
        memo: true,
      });
      setEnabledFields(savedFields);
    };
    loadSettings();
  }, []);

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key];
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: newValues };
    });
  };

  const toggleExpanded = (key) => {
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
  const getFilterLabel = (key, value) => {
    const labels = {
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
        <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-6 flex items-center gap-2">
          <Icon category="ui" name="analysis" size={28} />
          データ分析
        </h1>

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

            {/* Feeling filter */}
            {enabledFields.feeling && (
              <div className="border border-[var(--color-neutral-300)] rounded-lg">
                <button
                  onClick={() => toggleExpanded('feeling')}
                  className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-neutral-100)] transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-neutral-900)]">感触</span>
                    {filters.feeling.length > 0 && (
                      <span className="px-2 py-0.5 bg-[var(--color-primary-green)] text-white text-xs rounded-full">
                        {filters.feeling.length}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-[var(--color-neutral-600)] transition-transform ${expandedFilters.feeling ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFilters.feeling && (
                  <div className="p-3 pt-0 border-t border-[var(--color-neutral-200)]">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'great', label: '😄 最高' },
                  { value: 'good', label: '🙂 良い' },
                  { value: 'normal', label: '😐 普通' },
                  { value: 'bad', label: '😞 悪い' },
                  { value: 'unsure', label: '🤔 微妙' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.feeling.includes(value)}
                      onChange={() => toggleFilter('feeling', value)}
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
                        : 'text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-200)]'
                    }`}
                  >
                    拡大 (30yd)
                  </button>
                  <button
                    onClick={() => setScatterRange(70)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      scatterRange === 70
                        ? 'bg-[var(--color-primary-green)] text-white'
                        : 'text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-200)]'
                    }`}
                  >
                    全体 (70yd)
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <svg width="400" height="400" viewBox="-50 -50 400 400">
                  {/* Target circles - dynamic based on range */}
                  {(() => {
                    const center = 150;
                    // 30yd view: 182px = 30yd (拡大表示)
                    // 70yd view: 182px = 70yd (全体表示)
                    const baseScale = scatterRange === 30 ? 182 / 30 : 182 / 70;
                    const circles = scatterRange === 30
                      ? [30, 20, 10]
                      : [70, 60, 50, 40, 30, 20, 10];
                    const colors = ['#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040', '#262626'];

                    return circles.map((yards, index) => (
                      <circle
                        key={yards}
                        cx={center}
                        cy={center}
                        r={yards * baseScale}
                        fill="none"
                        stroke={colors[index] || '#737373'}
                        strokeWidth="1"
                      />
                    ));
                  })()}
                  <circle cx="150" cy="150" r="8" fill="none" stroke="#525252" strokeWidth="2" />

                  {/* Center crosshair */}
                  <line x1="145" y1="150" x2="155" y2="150" stroke="#525252" strokeWidth="1" />
                  <line x1="150" y1="145" x2="150" y2="155" stroke="#525252" strokeWidth="1" />

                  {/* Distance labels - dynamic based on range */}
                  {(() => {
                    const center = 150;
                    const baseScale = scatterRange === 30 ? 182 / 30 : 182 / 70;
                    const labels = scatterRange === 30
                      ? [30, 20, 10]
                      : [70, 60, 50, 40, 30, 20, 10];

                    return labels.map((yards) => (
                      <text
                        key={yards}
                        x={center}
                        y={center - (yards * baseScale) + 8}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#737373"
                      >
                        {yards}yd
                      </text>
                    ));
                  })()}

                  {/* Plot shot results */}
                  {(() => {
                    const center = 150;
                    const baseScale = scatterRange === 30 ? 182 / 30 : 182 / 70;

                    // 通常のショット（位置記録があるもの）
                    const normalShots = stats.shots.filter(shot => {
                      if (!shot.result || typeof shot.result !== 'object' || shot.result.x === undefined) {
                        return false;
                      }
                      if (scatterRange === 30) {
                        return Math.abs(shot.result.x) <= 30 && Math.abs(shot.result.y) <= 30;
                      }
                      return true;
                    });

                    return (
                      <>
                        {/* 通常のショットを緑の点で表示 */}
                        {normalShots.map((shot, index) => {
                          const plotX = center + (shot.result.x * baseScale);
                          const plotY = center - (shot.result.y * baseScale);
                          return (
                            <circle
                              key={`normal-${shot.id || index}`}
                              cx={plotX}
                              cy={plotY}
                              r="3"
                              fill="var(--color-primary-green)"
                              opacity="0.7"
                            />
                          );
                        })}
                      </>
                    );
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
                    const labels = {
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
                              <span className="text-sm text-[var(--color-neutral-600)] ml-2">{shot.distance}yd</span>
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
};
