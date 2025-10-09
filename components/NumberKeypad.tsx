'use client';

import React from 'react';

interface NumberKeypadProps {
  value: number | null;
  onChange: (value: number | null) => void;
  max?: number;
  label?: string;
}

/**
 * 大きな数字キーパッドコンポーネント
 * ネイティブアプリのような入力体験を提供
 */
export function NumberKeypad({ value, onChange, max = 999, label = '距離 (Yd)' }: NumberKeypadProps) {
  const displayValue = value?.toString() || '';

  const handleNumberClick = (num: string) => {
    const newValue = displayValue + num;
    const numValue = parseInt(newValue);

    if (numValue <= max) {
      onChange(numValue);
    }
  };

  const handleDelete = () => {
    if (displayValue.length === 0) return;

    const newValue = displayValue.slice(0, -1);
    if (newValue === '') {
      onChange(null);
    } else {
      onChange(parseInt(newValue));
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="w-full">
      {/* 入力表示エリア */}
      <div className="mb-4 bg-white rounded-xl border-2 border-[var(--color-primary-green)] p-4 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-neutral-700)]">
            {label}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[var(--color-primary-green)] min-w-[80px] text-right">
              {displayValue || "0"}
            </span>
            <span className="text-lg text-[var(--color-neutral-500)]">Yd</span>
          </div>
        </div>
      </div>

      {/* 数字キーパッド */}
      <div className="grid grid-cols-3 gap-2">
        {/* 数字ボタン 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            className="h-14 rounded-xl bg-white border-2 border-[var(--color-neutral-300)] text-xl font-bold text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)] hover:border-[var(--color-primary-green)] active:scale-95 transition-all shadow-sm"
          >
            {num}
          </button>
        ))}

        {/* クリアボタン */}
        <button
          onClick={handleClear}
          className="h-14 rounded-xl bg-[var(--color-success-border)] border-2 border-[var(--color-primary-green)] text-xl font-bold text-[var(--color-primary-green)] hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center"
        >
          C
        </button>

        {/* 0ボタン */}
        <button
          onClick={() => handleNumberClick("0")}
          className="h-14 rounded-xl bg-white border-2 border-[var(--color-neutral-300)] text-xl font-bold text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)] hover:border-[var(--color-primary-green)] active:scale-95 transition-all shadow-sm"
        >
          0
        </button>

        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          className="h-14 rounded-xl bg-[var(--color-secondary-red)] border-2 border-[var(--color-secondary-red)] hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center"
        >
          <svg
            className="w-7 h-7 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
