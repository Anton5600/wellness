import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { compassService } from '../services/compassService';
import { UnlockedFeatures, StreakInfo } from '../types';

/**
 * Загружает флаги разблокировки фич и текущий streak для активного пользователя.
 * Вызывает compassService.setCurrentUserId, чтобы операции шли в нужный контур.
 */
export const useUnlockedFeatures = () => {
  const { user } = useAuth();
  const [features, setFeatures] = useState<UnlockedFeatures | null>(null);
  const [streak, setStreak] = useState<StreakInfo | null>(null);

  useEffect(() => {
    compassService.setCurrentUserId(user?.uid);
    let cancelled = false;
    (async () => {
      const [f, s] = await Promise.all([
        compassService.getUnlockedFeatures(),
        compassService.getStreak(),
      ]);
      if (cancelled) return;
      setFeatures(f);
      setStreak(s);
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  return { features, streak };
};

/** Дни подряд, требуемые для открытия конкретной фичи (зеркалит compassService.getUnlockedFeatures). */
export const FEATURE_DAYS = {
  cards: 14,
  patterns: 21,
  catalog: 30,
  exportPdf: 30,
} as const;

export type FeatureKey = keyof typeof FEATURE_DAYS;
