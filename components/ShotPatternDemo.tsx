"use client";

import React, { useState } from 'react';

// ショットデータの型
type ShotData = {
  x: number; // ヤード（横方向、右がプラス）
  y: number; // ヤード（縦方向、オーバーがプラス）
};

// デモ用のショットデータ（10回中7回は右にずれている）
const DEMO_SHOTS: ShotData[] = [
  // 右側7つ（広範囲に分散）
  { x: 18, y: 8 },    // 右・大オーバー
  { x: 22, y: -5 },   // 右・ショート
  { x: 12, y: 10 },   // 右・大オーバー
  { x: 25, y: 2 },    // 右・ジャスト
  { x: 16, y: -8 },   // 右・大ショート
  { x: 14, y: 5 },    // 右・オーバー
  { x: 20, y: -3 },   // 右・少しショート
  // 左側3つ（広範囲に分散）
  { x: -15, y: 6 },   // 左・オーバー
  { x: -10, y: -7 },  // 左・ショート
  { x: -18, y: 3 },   // 左・少しオーバー
];

export default function ShotPatternDemo() {
  const [scatterRange, setScatterRange] = useState<30 | 70>(30);

  return (
    <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-base font-bold whitespace-nowrap">結果分布</h2>
        {/* Range toggle */}
        <div className="flex items-center gap-1 bg-[var(--color-neutral-100)] rounded-lg p-0.5">
          <button
            onClick={() => setScatterRange(30)}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors whitespace-nowrap ${
              scatterRange === 30
                ? 'bg-[var(--color-primary-green)] text-white'
                : 'text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-200)]'
            }`}
          >
            拡大 (30Yd)
          </button>
          <button
            onClick={() => setScatterRange(70)}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors whitespace-nowrap ${
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
          width="400"
          height="400"
          viewBox="-34 -42 368 375"
          style={{ width: '100%', maxWidth: '400px', height: 'auto' }}
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
            const normalShots = DEMO_SHOTS.filter((shot) => {
              if (scatterRange === 30) {
                return Math.abs(shot.x) <= 30 && Math.abs(shot.y) <= 30;
              }
              return true;
            });

            return normalShots.map((shot, index) => {
              const scale = scatterRange === 70 ? 182 / 70 : 182 / 30;
              const plotX = 150 + (shot.x * scale);
              const plotY = 150 - (shot.y * scale);
              return (
                <circle
                  key={`normal-${index}`}
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
  );
}
