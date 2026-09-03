import { StreakInfo } from '../../types';

/**
 * Переход стрика между днями — чистая логика «грейс-периода» из ТЗ «Утренний мост».
 * 1 пропущенный день не ломает стрик («вчера — пауза»), сброс только после 2+ дней.
 * Без сайд-эффектов: вычисление не трогает хранилище, запись делает вызывающий сервис.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Разница в днях между двумя датами `YYYY-MM-DD` (UTC-строки, как в compassService). */
export const daysBetween = (a: string, b: string): number => {
  const da = Date.parse(`${a}T00:00:00.000Z`);
  const db = Date.parse(`${b}T00:00:00.000Z`);
  if (Number.isNaN(da) || Number.isNaN(db)) return 0;
  return Math.round((db - da) / DAY_MS);
};

/**
 * Следующее состояние стрика при активности в день `today`.
 * gap = daysBetween(prev.lastActiveDate, today):
 *  - 0 → уже активны сегодня, без изменений;
 *  - 1 → вчера → current += 1;
 *  - 2 → пропущен 1 день → current += 1 (грейс);
 *  - ≥3 → пропущено 2+ дня → current = 1 (сброс).
 * Всегда longest = max(longest, current), lastActiveDate = today.
 */
export const computeStreakTransition = (prev: StreakInfo, today: string): StreakInfo => {
  const gap = daysBetween(prev.lastActiveDate, today);

  let current = prev.current;
  if (gap === 0) {
    return { ...prev };
  } else if (gap === 1 || gap === 2) {
    current += 1;
  } else {
    current = 1;
  }

  return {
    current,
    longest: Math.max(prev.longest, current),
    lastActiveDate: today,
  };
};

/** Сколько дней пропущено с последней активности до `today` (0/1/2, дальше клипается). */
export const missedDays = (prev: StreakInfo, today: string): 0 | 1 | 2 => {
  const gap = daysBetween(prev.lastActiveDate, today);
  if (gap <= 0) return 0;
  if (gap === 1) return 1;
  return 2;
};
