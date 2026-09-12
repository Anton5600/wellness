/**
 * Чистая логика жеста «потянуть вниз для обновления» (pull-to-refresh).
 *
 * Отделена от компонента намеренно: тесты в проекте работают без DOM, поэтому
 * пороги и правила решений живут здесь, а `components/PullToRefresh.tsx` только
 * подписывается на touch-события и передаёт сюда числа.
 */

/** Порог протяжки, после которого отпускание запускает обновление. */
export const REFRESH_THRESHOLD = 64;

/** Максимальная протяжка: дальше индикатор не уезжает. */
export const MAX_PULL = 110;

/** Доля движения пальца, которая передаётся контенту (протяжка «с сопротивлением»). */
export const PULL_RESISTANCE = 0.5;

/** Сдвиг, после которого жест считается потягиванием, а не скроллом или тапом. */
export const ENGAGE_AT = 8;

/**
 * Считать ли жест потягиванием вниз. Требуем три условия: список уже в начале
 * (иначе это обычная прокрутка вверх), движение вниз и вертикальное движение
 * заметно больше горизонтального (иначе это свайп вбок).
 */
export const shouldEngagePull = (dx: number, dy: number, atTop: boolean): boolean =>
  atTop && dy > ENGAGE_AT && Math.abs(dy) > Math.abs(dx);

/** Смещение контента при протяжке на `dy` пикселей. */
export const pullOffsetFor = (dy: number): number =>
  Math.max(0, Math.min(MAX_PULL, dy * PULL_RESISTANCE));

/** Запускать ли обновление при отпускании пальца. */
export const isRefreshTriggered = (pull: number): boolean => pull >= REFRESH_THRESHOLD;

/** Подпись у индикатора для текущего состояния. */
export const pullLabel = (pull: number, refreshing: boolean): string => {
  if (refreshing) return 'Обновляем…';
  return isRefreshTriggered(pull) ? 'Отпустите' : 'Потяните вниз';
};
