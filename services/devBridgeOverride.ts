import { EntryContext } from './recommendation/entry';
import { TimeOfDayPattern } from './recommendation/pattern';

/**
 * Dev-only «тест Утреннего моста» — подменяет вчерашний контекст, чтобы вручную
 * прогнать все сценарии входа, баннер разблокировки и карточку паттерна. Работает
 * только в dev-сборке (import.meta.env.DEV): в продакшене чтение всегда null.
 *
 * ВРЕМЕННЫЙ инструмент — удалить вместе с DevBridgeTester после приёмки.
 */

const ENTRY_KEY = 'compass_dev_entry_override';
const UNLOCK_KEY = 'compass_dev_unlock_override';
const PATTERN_KEY = 'compass_dev_pattern_override';

/** Сценарии, которые можно «надеть» на экран входа (warm — тёплый фон после критического пульса). */
export type DevEntryScenario =
  | 'fresh_returning'
  | 'fresh_first'
  | 'pending_feedback'
  | 'unfinished_practice'
  | 'missed_pause'
  | 'missed_reset'
  | 'warm_fresh'
  | 'warm_missed';

export const readDevEntryOverride = (): DevEntryScenario | null => {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = localStorage.getItem(ENTRY_KEY);
    return raw && (DEV_ENTRY_SCENARIOS as readonly string[]).includes(raw)
      ? (raw as DevEntryScenario)
      : null;
  } catch {
    return null;
  }
};

export const setDevEntryOverride = (scenario: DevEntryScenario | null): void => {
  if (!import.meta.env.DEV) return;
  try {
    if (scenario === null) localStorage.removeItem(ENTRY_KEY);
    else localStorage.setItem(ENTRY_KEY, scenario);
  } catch {}
};

/** День (14/30), для которого принудительно показать баннер «Открылось: …» после ритуала. */
export const readDevUnlockOverride = (): number | null => {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return [14, 30].includes(n) ? n : null;
  } catch {
    return null;
  }
};

export const setDevUnlockOverride = (day: number | null): void => {
  if (!import.meta.env.DEV) return;
  try {
    if (day === null) localStorage.removeItem(UNLOCK_KEY);
    else localStorage.setItem(UNLOCK_KEY, String(day));
  } catch {}
};

/** Тип подмены карточки паттерна: реальное наблюдение или «данных пока мало». */
export type DevPatternOverride = 'pattern' | 'insufficient';

export const readDevPatternOverride = (): DevPatternOverride | null => {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = localStorage.getItem(PATTERN_KEY);
    return raw === 'pattern' || raw === 'insufficient' ? (raw as DevPatternOverride) : null;
  } catch {
    return null;
  }
};

export const setDevPatternOverride = (value: DevPatternOverride | null): void => {
  if (!import.meta.env.DEV) return;
  try {
    if (value === null) localStorage.removeItem(PATTERN_KEY);
    else localStorage.setItem(PATTERN_KEY, value);
  } catch {}
};

/** Синтетическое наблюдение «время суток» для ручной проверки карточки. */
export const buildDevPattern = (): TimeOfDayPattern => ({
  id: 'tod:evening_harder:fear',
  kind: 'time_of_day',
  direction: 'evening_harder',
  emotion: 'fear',
  practiceId: 'vibroPacing',
  reminder: { hour: 17, minute: 30 },
  statement: 'Я замечаю, что к вечеру тревога нарастает, а утром ты обычно спокойнее.',
  suggestion: 'Попробуй «Вибро-ритм» около 17:30 — до того, как волна поднимется.',
});

export const DEV_ENTRY_SCENARIOS: readonly DevEntryScenario[] = [
  'fresh_returning',
  'fresh_first',
  'pending_feedback',
  'unfinished_practice',
  'missed_pause',
  'missed_reset',
  'warm_fresh',
  'warm_missed',
];

const todayStr = '2026-09-02';

/** Синтетический вчерашний день: цвет/масло/практика для «карточки вчера». */
const yesterdayBase = {
  completed: true,
  eveningFeedbackDone: true,
  practiceInterrupted: false,
  practiceProgress: 0,
  hadCriticalPulse: false,
  color: '#98c281',
  oil: 'Лаванда',
  practiceId: 'bodyScan' as const,
};

/**
 * Синтетический EntryContext для выбранного тестового сценария. Определяет тот же
 * determineEntryScenario, что и боевой путь, — но данные не читаются из Firestore.
 */
export const buildDevEntryContext = (scenario: DevEntryScenario): EntryContext => {
  switch (scenario) {
    case 'fresh_returning':
      return {
        timeOfDay: 'morning',
        streak: { current: 3, longest: 3, lastActiveDate: '2026-09-01' },
        missed: 0,
        yesterday: { ...yesterdayBase },
        today: { isUnlockDay: false },
      };
    case 'fresh_first':
      return {
        timeOfDay: 'morning',
        streak: { current: 1, longest: 1, lastActiveDate: todayStr },
        missed: 0,
        yesterday: {
          completed: false,
          eveningFeedbackDone: false,
          practiceInterrupted: false,
          practiceProgress: 0,
          hadCriticalPulse: false,
        },
        today: { isUnlockDay: false },
      };
    case 'pending_feedback':
      return {
        timeOfDay: 'morning',
        streak: { current: 4, longest: 4, lastActiveDate: '2026-09-01' },
        missed: 0,
        yesterday: { ...yesterdayBase, eveningFeedbackDone: false },
        today: { isUnlockDay: false },
      };
    case 'unfinished_practice':
      return {
        timeOfDay: 'morning',
        streak: { current: 5, longest: 5, lastActiveDate: '2026-09-01' },
        missed: 0,
        yesterday: {
          ...yesterdayBase,
          eveningFeedbackDone: false,
          practiceInterrupted: true,
          practiceProgress: 0.7,
        },
        today: { isUnlockDay: false },
      };
    case 'missed_pause':
      return {
        timeOfDay: 'morning',
        streak: { current: 6, longest: 6, lastActiveDate: '2026-08-31' },
        missed: 1,
        yesterday: {
          completed: false,
          eveningFeedbackDone: false,
          practiceInterrupted: false,
          practiceProgress: 0,
          hadCriticalPulse: false,
        },
        today: { isUnlockDay: false },
      };
    case 'missed_reset':
      return {
        timeOfDay: 'morning',
        streak: { current: 1, longest: 8, lastActiveDate: '2026-08-30' },
        missed: 2,
        yesterday: {
          completed: false,
          eveningFeedbackDone: false,
          practiceInterrupted: false,
          practiceProgress: 0,
          hadCriticalPulse: false,
        },
        today: { isUnlockDay: false },
      };
    case 'warm_fresh':
      return {
        timeOfDay: 'morning',
        streak: { current: 3, longest: 3, lastActiveDate: '2026-09-01' },
        missed: 0,
        yesterday: { ...yesterdayBase, hadCriticalPulse: true },
        today: { isUnlockDay: false },
      };
    case 'warm_missed':
      return {
        timeOfDay: 'morning',
        streak: { current: 6, longest: 6, lastActiveDate: '2026-08-31' },
        missed: 1,
        yesterday: {
          completed: false,
          eveningFeedbackDone: false,
          practiceInterrupted: false,
          practiceProgress: 0,
          hadCriticalPulse: true,
        },
        today: { isUnlockDay: false },
      };
  }
};
