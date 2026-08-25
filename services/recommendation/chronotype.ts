import { Chronotype } from '../../types';

/**
 * Хронотип по часу суток (локальное время).
 *   5–12 — утро, 12–18 — день, 18–5 — вечер.
 */
export const chronotypeForHour = (hour: number): Chronotype => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'day';
  return 'evening';
};
