import React from 'react';
import { readDevStreakOverride, setDevStreakOverride } from '../services/devStreakOverride';
import { UNLOCK_DAYS } from '../services/recommendation/unlock';

const MIN_DAY = 1;
const MAX_DAY = 31; // 30 + 1, чтобы увидеть «всё открыто» и границу после последнего порога
const THRESHOLD_DAYS: Set<number> = new Set(Object.values(UNLOCK_DAYS));

/**
 * Dev-only ползунок «день стрика». Позволяет скроллом выбрать день 1..31 — приложение
 * пересчитывает разблокировки от этого значения (см. readDevStreakOverride в compassService).
 * В продакшене не рендерится вовсе (import.meta.env.DEV === false).
 */
export const StreakDayScroller: React.FC = () => {
  if (!import.meta.env.DEV) return null;

  const current = readDevStreakOverride();
  const days = Array.from({ length: MAX_DAY - MIN_DAY + 1 }, (_, i) => MIN_DAY + i);

  const select = (day: number | null) => {
    setDevStreakOverride(day);
    window.location.reload();
  };

  return (
    <div className="px-6 pt-4">
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">science</span>
            Тест: день стрика
          </p>
          <button
            onClick={() => select(null)}
            className="text-xs font-semibold text-amber-700 dark:text-amber-300 underline underline-offset-2"
          >
            Авто (реальный)
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {days.map((d) => {
            const selected = current === d;
            const isThreshold = THRESHOLD_DAYS.has(d);
            return (
              <button
                key={d}
                onClick={() => select(d)}
                className={`relative shrink-0 size-9 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                  selected
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 text-forest dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {d}
                {isThreshold && (
                  <span
                    className={`absolute -top-1 -right-1 size-2 rounded-full ${selected ? 'bg-white' : 'bg-amber-500'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 mt-1.5 font-medium">
          Точка сверху — порог разблокировки (3·5·10·14·21·30). Выбор применяется после перезагрузки.
        </p>
      </div>
    </div>
  );
};

export default StreakDayScroller;
