import { UnlockedFeatures } from '../../types';

/** Пороги открытия фич по количеству дней подряд (streak). */
export const UNLOCK_DAYS = {
  eveningCheckin: 3,
  mapDay: 5,
  weeklyCheck: 7,
  cards: 10,
  patterns: 14,
  catalog: 21,
  exportPdf: 30,
} as const;

/**
 * Чистая функция streak-гейтинга: по числу дней подряд возвращает флаги
 * разблокированных фич. Без сайд-эффектов, чтобы быть легко тестируемой.
 */
export function computeUnlockedFeatures(days: number): UnlockedFeatures {
  const d = Math.max(1, days);
  return {
    morningRitual: true,
    eveningCheckin: d >= UNLOCK_DAYS.eveningCheckin,
    mapDay: d >= UNLOCK_DAYS.mapDay,
    weeklyCheck: d >= UNLOCK_DAYS.weeklyCheck,
    cards: d >= UNLOCK_DAYS.cards,
    patterns: d >= UNLOCK_DAYS.patterns,
    catalog: d >= UNLOCK_DAYS.catalog,
    exportPdf: d >= UNLOCK_DAYS.exportPdf,
  };
}
