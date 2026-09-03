import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Единая обёртка хаптики: натив — `@capacitor/haptics`, веб — `navigator.vibrate`.
 * Все вызовы безопасны на любой платформе (никогда не бросают) и резолвятся void.
 */

const webVibrate = (pattern: number | number[]): boolean => {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
      ? navigator.vibrate(pattern)
      : false;
  } catch {
    return false;
  }
};

/** Лёгкий/средний/сильный «тап» — смена зоны, тап по чипу, появление буквы. */
export const hapticImpact = async (style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const impact = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }[style];
      await Haptics.impact({ style: impact });
      return;
    } catch (e) {
      console.warn('[Haptics] impact failed:', e);
    }
  }
  const ms = { light: 10, medium: 25, heavy: 50 }[style];
  webVibrate(ms);
};

/** Уведомительная хаптика — смена фазы, арома-кью, предупреждение. */
export const hapticNotification = async (type: 'success' | 'warning' | 'error'): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const nt = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error }[type];
      await Haptics.notification({ type: nt });
      return;
    } catch (e) {
      console.warn('[Haptics] notification failed:', e);
    }
  }
  const ms = { success: 30, warning: 60, error: 90 }[type];
  webVibrate(ms);
};

/** Одиночный импульс заданной длительности (вибро-биение). */
export const hapticVibrate = async (durationMs: number): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.vibrate({ duration: durationMs });
      return;
    } catch (e) {
      console.warn('[Haptics] vibrate failed:', e);
    }
  }
  webVibrate(durationMs);
};

/** Паттерн вибрации (нарастание/затухание PMR). Натив: суммарная длительность. */
export const hapticVibratePattern = async (durationsMs: number[]): Promise<void> => {
  if (!durationsMs || durationsMs.length === 0) return;
  if (Capacitor.isNativePlatform()) {
    const total = durationsMs.reduce((a, b) => a + b, 0);
    await hapticVibrate(total);
    return;
  }
  webVibrate(durationsMs);
};
