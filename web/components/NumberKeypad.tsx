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
      <div className="mb-6 bg-white rounded-2xl border-2 border-[var(--color-primary-green)] p-6 shadow-lg">
        <div className="text-center">
          <p className="text-sm text-[var(--color-neutral-600)] mb-2">{label}</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-6xl font-bold text-[var(--color-primary-green)] min-w-[200px] text-center">
              {displayValue || '0'}
            </span>
            <span className="text-2xl text-[var(--color-neutral-500)]">Yd</span>
          </div>
        </div>
      </div>

      {/* 数字キーパッド */}
      <div className="grid grid-cols-3 gap-3">
        {/* 数字ボタン 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            className="aspect-square rounded-2xl bg-white border-2 border-[var(--color-neutral-300)] text-4xl font-bold text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)] hover:border-[var(--color-primary-green)] active:scale-95 transition-all shadow-sm"
          >
            {num}
          </button>
        ))}

        {/* クリアボタン */}
        <button
          onClick={handleClear}
          className="aspect-square rounded-2xl bg-[var(--color-neutral-200)] border-2 border-[var(--color-neutral-300)] text-lg font-bold text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-300)] active:scale-95 transition-all shadow-sm flex items-center justify-center"
        >
          C
        </button>

        {/* 0ボタン */}
        <button
          onClick={() => handleNumberClick('0')}
          className="aspect-square rounded-2xl bg-white border-2 border-[var(--color-neutral-300)] text-4xl font-bold text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)] hover:border-[var(--color-primary-green)] active:scale-95 transition-all shadow-sm"
        >
          0
        </button>

        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          className="aspect-square rounded-2xl bg-[var(--color-secondary-red)] border-2 border-[var(--color-secondary-red)] hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center"
        >
          <svg
            className="w-10 h-10 text-white"
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
