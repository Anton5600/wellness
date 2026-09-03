import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEV_ENTRY_SCENARIOS,
  DevEntryScenario,
  readDevEntryOverride,
  setDevEntryOverride,
  readDevUnlockOverride,
  setDevUnlockOverride,
  readDevPatternOverride,
  setDevPatternOverride,
  DevPatternOverride,
} from '../services/devBridgeOverride';

const SCENARIO_LABELS: Record<DevEntryScenario, string> = {
  fresh_returning: 'Fresh · возврат',
  fresh_first: 'Fresh · первый день',
  pending_feedback: 'Фидбек вчера',
  unfinished_practice: 'Незаверш. практика',
  missed_pause: 'Пропуск · пауза',
  missed_reset: 'Пропуск · сброс',
  warm_fresh: 'Тёплый фон · fresh',
  warm_missed: 'Тёплый фон · пропуск',
};

const UNLOCK_OPTIONS: Array<{ day: number; label: string }> = [
  { day: 14, label: 'Баннер · Карта дня' },
  { day: 30, label: 'Баннер · Каталог+PDF' },
];

const PATTERN_OPTIONS: Array<{ value: DevPatternOverride; label: string }> = [
  { value: 'pattern', label: 'Паттерн · наблюдение' },
  { value: 'insufficient', label: 'Паттерн · мало данных' },
];

/**
 * Dev-only панель «Тест: Утренний мост». Позволяет вручную надеть сценарий входа
 * (заменяет вчерашний контекст) и принудительно показать баннер разблокировки.
 * В продакшене не рендерится (import.meta.env.DEV === false).
 *
 * ВРЕМЕННЫЙ инструмент — удалить вместе с devBridgeOverride.ts после приёмки.
 */
export const DevBridgeTester: React.FC = () => {
  const navigate = useNavigate();
  if (!import.meta.env.DEV) return null;

  const currentScenario = readDevEntryOverride();
  const currentUnlock = readDevUnlockOverride();
  const currentPattern = readDevPatternOverride();

  const pickScenario = (s: DevEntryScenario) => {
    setDevEntryOverride(s);
    navigate('/entry');
  };

  const pickUnlock = (day: number) => {
    setDevUnlockOverride(day);
    window.location.reload();
  };

  const pickPattern = (value: DevPatternOverride) => {
    setDevPatternOverride(value);
    window.location.reload();
  };

  const reset = () => {
    setDevEntryOverride(null);
    setDevUnlockOverride(null);
    setDevPatternOverride(null);
    window.location.reload();
  };

  return (
    <div className="px-6 pt-4">
      <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">directions_walk</span>
            Тест: утренний мост
          </p>
          <button
            onClick={reset}
            className="text-xs font-semibold text-sky-700 dark:text-sky-300 underline underline-offset-2"
          >
            Сбросить
          </button>
        </div>

        <p className="text-[10px] font-bold text-sky-600/80 dark:text-sky-400/70 mb-1.5 uppercase tracking-wider">Сценарий входа</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {DEV_ENTRY_SCENARIOS.map((s) => (
            <button
              key={s}
              onClick={() => pickScenario(s)}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                currentScenario === s
                  ? 'bg-sky-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-forest dark:text-gray-200 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {SCENARIO_LABELS[s]}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-bold text-sky-600/80 dark:text-sky-400/70 mb-1.5 mt-2 uppercase tracking-wider">
          Баннер разблокировки (после ритуала)
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {UNLOCK_OPTIONS.map((o) => (
            <button
              key={o.day}
              onClick={() => pickUnlock(o.day)}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                currentUnlock === o.day
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-forest dark:text-gray-200 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-bold text-sky-600/80 dark:text-sky-400/70 mb-1.5 mt-2 uppercase tracking-wider">
          Паттерн (после ритуала)
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {PATTERN_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => pickPattern(o.value)}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                currentPattern === o.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-forest dark:text-gray-200 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-sky-600/80 dark:text-sky-400/70 mt-1.5 font-medium">
          Сценарий открывает экран /entry; баннер и паттерн — после отправки ритуала на дашборде (нужна пустая запись за сегодня).
        </p>
      </div>
    </div>
  );
};

export default DevBridgeTester;
