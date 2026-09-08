import React from 'react';
import { readDevDateOverride, setDevDateOverride } from '../services/devDateOverride';

const toDateStr = (d: Date): string => d.toISOString().split('T')[0];

const shiftDays = (base: string, delta: number): string => {
  const d = new Date(`${base}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().split('T')[0];
};

/**
 * Dev-only «машина времени»: сдвигает «сегодня» во всём приложении, чтобы вручную
 * прогнать стрик по датам (инкремент, грейс-пропуск, сброс, пороги разблокировок).
 * В продакшене не рендерится (import.meta.env.DEV === false).
 *
 * ВРЕМЕННЫЙ инструмент — удалить вместе с devDateOverride.ts после приёмки.
 */
export const DevDateTraveller: React.FC = () => {
  if (!import.meta.env.DEV) return null;

  const override = readDevDateOverride();
  const effective = override ?? toDateStr(new Date());
  const isOverridden = override !== null;

  const go = (delta: number) => {
    setDevDateOverride(shiftDays(effective, delta));
    window.location.reload();
  };

  const reset = () => {
    setDevDateOverride(null);
    window.location.reload();
  };

  return (
    <div className="px-6 pt-4">
      <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Тест: машина времени (дата)
          </p>
          <button
            onClick={reset}
            className="text-xs font-semibold text-sky-700 dark:text-sky-300 underline underline-offset-2"
          >
            Авто (реальное)
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => go(-1)}
            className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 active:scale-95 transition-transform"
          >
            −1 день
          </button>
          <div className="flex-1 text-center text-sm font-bold text-forest dark:text-gray-100">
            {effective}
            <span className="ml-1 text-[10px] font-semibold text-sky-600/80 dark:text-sky-400/70">
              {isOverridden ? 'подмена' : 'реальное'}
            </span>
          </div>
          <button
            onClick={() => go(+1)}
            className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 active:scale-95 transition-transform"
          >
            +1 день
          </button>
        </div>
        <p className="text-[10px] text-sky-600/80 dark:text-sky-400/70 mt-1.5 font-medium">
          Сдвигает «сегодня» во всём приложении. Чек-ин в сдвинутый день двигает стрик; пропуск (+2/+3 подряд без чек-ина) проверяет грейс и сброс. Выбор применяется после перезагрузки.
        </p>
      </div>
    </div>
  );
};

export default DevDateTraveller;
