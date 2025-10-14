"use client";

import React from 'react';

// クラブパフォーマンスの型
type ClubPerformance = {
  club: string;
  accuracy: number;
  shotCount: number;
};

// デモ用のワーストクラブデータ
const DEMO_WORST_CLUBS: ClubPerformance[] = [
  { club: '3W', accuracy: 29, shotCount: 15 },
  { club: '5I', accuracy: 26, shotCount: 20 },
  { club: '6I', accuracy: 24, shotCount: 25 },
  { club: '5W', accuracy: 17, shotCount: 19 },
  { club: '9I', accuracy: 16, shotCount: 32 },
];

export default function WorstClubsDemo() {
  return (
    <div style={{ background: '#eadec2' }} className="rounded-lg shadow-md p-6">
      <div className="bg-[var(--color-error-bg)] rounded-lg p-3 sm:p-4 border-l-4 border-[var(--color-error-text)]">
        <h2 className="text-base sm:text-lg font-bold text-[var(--color-error-text)] mb-3 sm:mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-error-text)] flex-shrink-0"
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
          {DEMO_WORST_CLUBS.map((club, index) => (
            <div
              key={club.club}
              className="flex items-center justify-between bg-white/50 rounded-lg p-2 sm:p-3"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {/* ゴルフクラブアイコン */}
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--color-neutral-700)] flex-shrink-0"
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
                  <p className={`text-[10px] sm:text-xs ${index === 0 ? 'sm:text-sm' : ''} text-[var(--color-neutral-600)] leading-tight`}>
                    ワースト
                  </p>
                  <p className={`text-sm sm:text-base ${index === 0 ? 'sm:text-xl' : ''} font-bold text-[var(--color-secondary-red)] leading-tight`}>
                    {index + 1}位
                  </p>
                </div>
                <div>
                  <span className="text-base sm:text-lg font-bold text-[var(--color-neutral-900)]">
                    {club.club}
                  </span>
                  <p className="text-[10px] sm:text-xs text-[var(--color-neutral-600)]">
                    {club.shotCount}ショット
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-[var(--color-neutral-600)] mb-1">
                  平均精度
                </p>
                <p className="text-sm sm:text-base font-bold text-[var(--color-secondary-red)]">
                  {club.accuracy} Yd
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
