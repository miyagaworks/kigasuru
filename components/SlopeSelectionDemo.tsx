"use client";

import React, { useState, useEffect } from 'react';

// 傾斜の種類
type SlopeType =
  | 'flat'
  | 'left-up'
  | 'left-down'
  | 'toe-up'
  | 'toe-down'
  | 'left-up-toe-up'
  | 'left-up-toe-down'
  | 'left-down-toe-up'
  | 'left-down-toe-down';

// SVGパスセグメントの計算
const calculateSegments = () => {
  const segments = [
    { angle: -112.5, slope: 'left-up' as SlopeType },
    { angle: -67.5, slope: 'left-up-toe-up' as SlopeType },
    { angle: -22.5, slope: 'toe-up' as SlopeType },
    { angle: 22.5, slope: 'left-down-toe-up' as SlopeType },
    { angle: 67.5, slope: 'left-down' as SlopeType },
    { angle: 112.5, slope: 'left-down-toe-down' as SlopeType },
    { angle: 157.5, slope: 'toe-down' as SlopeType },
    { angle: 202.5, slope: 'left-up-toe-down' as SlopeType },
  ];

  return segments.map(({ angle, slope }) => {
    const startAngle = angle;
    const endAngle = angle + 45;
    const outerRadius = 145;
    const innerRadius = 45;
    const centerX = 150;
    const centerY = 150;

    const toRadians = (deg: number) => (deg * Math.PI) / 180;

    const startOuterX = centerX + outerRadius * Math.cos(toRadians(startAngle));
    const startOuterY = centerY + outerRadius * Math.sin(toRadians(startAngle));
    const endOuterX = centerX + outerRadius * Math.cos(toRadians(endAngle));
    const endOuterY = centerY + outerRadius * Math.sin(toRadians(endAngle));
    const startInnerX = centerX + innerRadius * Math.cos(toRadians(endAngle));
    const startInnerY = centerY + innerRadius * Math.sin(toRadians(endAngle));
    const endInnerX = centerX + innerRadius * Math.cos(toRadians(startAngle));
    const endInnerY = centerY + innerRadius * Math.sin(toRadians(startAngle));

    const pathData = `
      M ${startOuterX} ${startOuterY}
      A ${outerRadius} ${outerRadius} 0 0 1 ${endOuterX} ${endOuterY}
      L ${startInnerX} ${startInnerY}
      A ${innerRadius} ${innerRadius} 0 0 0 ${endInnerX} ${endInnerY}
      Z
    `;

    return { angle, slope, pathData };
  });
};

// アイコンの配置計算 (4つの基本方向のみ)
const SLOPE_ICONS = [
  { angle: -90, slope: 'left-up' as SlopeType, icon: '/assets/icons/slope/slope-left-up.svg' },
  { angle: 0, slope: 'toe-up' as SlopeType, icon: '/assets/icons/slope/slope-toe-up.svg' },
  { angle: 90, slope: 'left-down' as SlopeType, icon: '/assets/icons/slope/slope-left-down.svg' },
  { angle: 180, slope: 'toe-down' as SlopeType, icon: '/assets/icons/slope/slope-toe-down.svg' },
].map(({ angle, slope, icon }) => {
  const iconSize = 100;
  const iconRadius = 94;
  const iconX = 150 + iconRadius * Math.cos((angle * Math.PI) / 180) - iconSize / 2;
  const iconY = 150 + iconRadius * Math.sin((angle * Math.PI) / 180) - iconSize / 2;

  return { angle, slope, icon, iconX, iconY, iconSize };
});

// 傾斜ラベルの位置を事前計算
const SLOPE_LABELS = [
  { angle: -112.5, slope: 'left-up' as SlopeType, label: '左足\n上がり', labelAngle: -81, labelRadius: 110 },
  { angle: -67.5, slope: 'left-up-toe-up' as SlopeType, label: '左足上がり\n＋\nつま先上がり', labelAngle: -45, labelRadius: 100 },
  { angle: -22.5, slope: 'toe-up' as SlopeType, label: 'つま先\n上がり', labelAngle: 0, labelRadius: 74 },
  { angle: 22.5, slope: 'left-down-toe-up' as SlopeType, label: '左足下がり\n＋\nつま先上がり', labelAngle: 45, labelRadius: 100 },
  { angle: 67.5, slope: 'left-down' as SlopeType, label: '左足\n下がり', labelAngle: 81, labelRadius: 100 },
  { angle: 112.5, slope: 'left-down-toe-down' as SlopeType, label: '左足下がり\n＋\nつま先下がり', labelAngle: 135, labelRadius: 100 },
  { angle: 157.5, slope: 'toe-down' as SlopeType, label: 'つま先\n下がり', labelAngle: 178, labelRadius: 74 },
  { angle: 202.5, slope: 'left-up-toe-down' as SlopeType, label: '左足上がり\n＋\nつま先下がり', labelAngle: -135, labelRadius: 100 },
].map(({ angle, slope, label, labelAngle, labelRadius }) => {
  const centerX = 150;
  const centerY = 150;
  const labelX = centerX + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
  const labelY = centerY + labelRadius * Math.sin((labelAngle * Math.PI) / 180);
  const fontSize = angle % 90 === 0 ? '14' : '11';
  const fontWeight = angle % 90 === 0 ? 'bold' : 'normal';

  return { slope, label, labelX, labelY, fontSize, fontWeight };
});

// 傾斜の表示名
const getSlopeDisplayName = (slope: SlopeType): string => {
  const names: Record<SlopeType, string> = {
    flat: '平坦',
    'left-up': '左足上がり',
    'left-down': '左足下がり',
    'toe-up': 'つま先上がり',
    'toe-down': 'つま先下がり',
    'left-up-toe-up': '左足上がり＋つま先上がり',
    'left-up-toe-down': '左足上がり＋つま先下がり',
    'left-down-toe-up': '左足下がり＋つま先上がり',
    'left-down-toe-down': '左足下がり＋つま先下がり',
  };
  return names[slope] || slope;
};

const SLOPE_SEGMENTS = calculateSegments();

export default function SlopeSelectionDemo() {
  const [currentSlope, setCurrentSlope] = useState<SlopeType | null>(null);
  const [simulatedGyroSlope, setSimulatedGyroSlope] = useState<SlopeType>('flat');

  // ジャイロセンサーのシミュレーション（平坦から右回りに巡回）
  useEffect(() => {
    const slopeSequence: SlopeType[] = [
      'flat',
      'left-up',
      'left-up-toe-up',
      'toe-up',
      'left-down-toe-up',
      'left-down',
      'left-down-toe-down',
      'toe-down',
      'left-up-toe-down',
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % slopeSequence.length;
      setSimulatedGyroSlope(slopeSequence[currentIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* 円形傾斜セレクター */}
      <div className="relative w-full max-w-sm mx-auto" style={{ aspectRatio: '1/1' }}>
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* 8方向のセグメント */}
          {SLOPE_SEGMENTS.map(({ slope, pathData }) => {
            const isActive = currentSlope === slope;
            const isHovered = simulatedGyroSlope === slope && !isActive;

            return (
              <g key={slope}>
                <path
                  d={pathData}
                  fill={isActive || isHovered ? 'var(--color-primary-green)' : 'var(--color-card-bg)'}
                  opacity={isActive || isHovered ? '1' : '0.5'}
                  stroke={isActive || isHovered ? 'var(--color-primary-green)' : 'var(--color-primary-dark)'}
                  strokeWidth="2"
                  className="cursor-pointer"
                  style={{
                    transition: 'fill 0.15s ease, opacity 0.15s ease, stroke 0.15s ease',
                  }}
                  onClick={() => setCurrentSlope(slope)}
                />
              </g>
            );
          })}

          {/* 中央の円 */}
          <circle
            cx="150"
            cy="150"
            r="45"
            fill={
              simulatedGyroSlope === 'flat'
                ? 'var(--color-primary-green)'
                : 'var(--color-card-bg)'
            }
            opacity={
              simulatedGyroSlope === 'flat'
                ? '1'
                : '0.5'
            }
            stroke="var(--color-primary-dark)"
            strokeWidth="2"
            className="cursor-pointer"
            style={{
              transition: 'fill 0.15s ease, opacity 0.15s ease, stroke 0.15s ease',
            }}
            onClick={() => setCurrentSlope('flat')}
          />

          {/* 中央のテキスト */}
          <text
            x="150"
            y="150"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={
              simulatedGyroSlope === 'flat'
                ? 'white'
                : '#212121'
            }
            fontSize="12"
            fontWeight="normal"
            className="pointer-events-none select-none"
            style={{
              transition: 'fill 0.15s ease',
            }}
          >
            平坦
          </text>

          {/* 4つの人間アイコン */}
          {SLOPE_ICONS.map(({ slope, icon, iconX, iconY, iconSize }) => {
            const isActive = currentSlope === slope;
            const isHovered = simulatedGyroSlope === slope && !isActive;

            return (
              <image
                key={`icon-${slope}`}
                href={icon}
                x={iconX}
                y={iconY}
                width={iconSize}
                height={iconSize}
                opacity={isActive || isHovered ? '1' : '0.5'}
                className="pointer-events-none"
                style={{
                  transition: 'opacity 0.15s ease',
                }}
              />
            );
          })}

          {/* テキストラベル（最前面） */}
          {SLOPE_LABELS.map(({ slope, label, labelX, labelY, fontSize, fontWeight }) => {
            const isActive = currentSlope === slope;
            const isHovered = simulatedGyroSlope === slope && !isActive;

            return (
              <text
                key={`label-${slope}`}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive || isHovered ? 'white' : '#212121'}
                fontSize={fontSize}
                fontWeight={fontWeight}
                className="pointer-events-none select-none"
                style={{ whiteSpace: 'pre-line', transition: 'fill 0.15s ease' }}
              >
                {label.split('\n').map((line, i, arr) => (
                  <tspan key={i} x={labelX} dy={i === 0 ? `-${(arr.length - 1) * 0.5}em` : '1em'}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}
        </svg>
      </div>

      {/* ジャイロセンサー検出表示 */}
      {simulatedGyroSlope && (
        <div className="relative mt-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-primary-light)] opacity-80 rounded-2xl"></div>
          <div className="relative backdrop-blur-sm bg-white/10 border-2 border-white/30 rounded-2xl px-2 py-3 sm:p-5 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 mb-1 tracking-wide">ジャイロ検出中</p>
                <p className="text-base sm:text-xl font-bold text-white tracking-tight">
                  {getSlopeDisplayName(simulatedGyroSlope)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
