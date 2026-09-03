/**
 * Dev-only «день стрика» — переключатель для ручного прогона всех порогов разблокировок.
 *
 * Работает только в dev-сборке (import.meta.env.DEV); в продакшене чтение всегда
 * возвращает null, а запись ничего не делает — так пользователь не может накрутить
 * себе разблокировки.
 *
 * Значение пишется в localStorage, поэтому переживает перезагрузку страницы
 * (необходимо, чтобы после смены дня все компоненты перечитали streak).
 */

const OVERRIDE_KEY = 'compass_dev_streak_override';

/** Текущий принудительный день стрика (>=1) или null, если переключатель выключен. */
export const readDevStreakOverride = (): number | null => {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.round(n) : null;
  } catch {
    return null;
  }
};

/** Задать день (или null — сбросить на реальное значение из хранилища). */
export const setDevStreakOverride = (day: number | null): void => {
  if (!import.meta.env.DEV) return;
  try {
    if (day === null) {
      localStorage.removeItem(OVERRIDE_KEY);
    } else {
      localStorage.setItem(OVERRIDE_KEY, String(day));
    }
  } catch {}
};
