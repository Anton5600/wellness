/**
 * Dev-only «машина времени» — подмена «сегодня» для ручного прогона стрика по датам.
 *
 * Работает только в dev-сборке (import.meta.env.DEV); в продакшене чтение всегда
 * возвращает null, а запись ничего не делает. Дата пишется в localStorage
 * (`compass_dev_date_override`) в формате `YYYY-MM-DD` (UTC).
 *
 * ВРЕМЕННЫЙ инструмент — удалить вместе с DevDateTraveller после приёмки.
 */

const DATE_KEY = 'compass_dev_date_override';

/** Текущая подменённая дата `YYYY-MM-DD` или null, если «машина времени» выключена. */
export const readDevDateOverride = (): string | null => {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = localStorage.getItem(DATE_KEY);
    if (!raw) return null;
    const d = new Date(`${raw}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : raw;
  } catch {
    return null;
  }
};

/** Задать подменённую дату (`YYYY-MM-DD`) или null — вернуться к реальному «сегодня». */
export const setDevDateOverride = (date: string | null): void => {
  if (!import.meta.env.DEV) return;
  try {
    if (date === null) localStorage.removeItem(DATE_KEY);
    else localStorage.setItem(DATE_KEY, date);
  } catch {}
};
