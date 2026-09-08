import { EmotionKey, Arousal, PracticeId, PracticeFeedback } from '../../types';
import { DEFAULT_CONFIG, RecommendationConfig } from './config';

/**
 * Движок выбора соматической практики — чистая детерминированная логика (без LLM).
 * Матрица «эмоция × возбуждение → практика» и правило бана «не помогло» (зеркало
 * `effectiveness.ts`/`bannedOilIds`). Не трогает Firestore: состояние практик локальное.
 */

/** Класс активации по эмоции (используется, когда нет интенсивности вектора). */
export const AROUSAL_DEFAULT: Record<EmotionKey, Arousal> = {
  joy: 'high',
  trust: 'low',
  fear: 'high',
  surprise: 'high',
  sadness: 'low',
  disgust: 'low',
  anger: 'high',
  anticipation: 'low',
};

export const AROUSAL_INTENSITY_THRESHOLD = DEFAULT_CONFIG.dominanceThreshold;

/** Вывод активации: по интенсивности (если задана), иначе по классу эмоции. */
export const inferArousal = (dominant: EmotionKey, intensity?: number): Arousal => {
  if (typeof intensity === 'number' && Number.isFinite(intensity)) {
    return intensity >= AROUSAL_INTENSITY_THRESHOLD ? 'high' : 'low';
  }
  return AROUSAL_DEFAULT[dominant] ?? 'low';
};

/** Матрица выбора: все 16 клеток заполнены, порядок = приоритет. */
const PRACTICE_MATRIX: Record<EmotionKey, Record<Arousal, readonly PracticeId[]>> = {
  joy: { high: ['fingerTracing', 'mantraLoop'], low: ['fingerTracing', 'mantraLoop'] },
  trust: { high: ['fingerTracing', 'mantraLoop'], low: ['fingerTracing', 'mantraLoop'] },
  fear: { high: ['grounding54321'], low: ['vibroPacing'] },
  surprise: { high: ['grounding54321'], low: ['grounding54321'] },
  sadness: { high: ['thermalImagery', 'bodyScan'], low: ['bodyScan', 'thermalImagery'] },
  disgust: { high: ['expressiveWriting'], low: ['expressiveWriting'] },
  anger: { high: ['pmr'], low: ['mantraLoop'] },
  anticipation: { high: ['pmr', 'fingerTracing'], low: ['fingerTracing', 'pmr'] },
};

/** Выбор практики: пропускает забаненные, предпочитает «помогло»; фолбэк — первая из списка. */
export const selectPractice = (
  dominant: EmotionKey,
  arousal?: Arousal,
  banned?: ReadonlySet<PracticeId>,
  preferred?: ReadonlySet<PracticeId>
): PracticeId => {
  const band = arousal ?? inferArousal(dominant);
  const candidates = PRACTICE_MATRIX[dominant]?.[band] ?? ['bodyScan'];

  // Сначала отсекаем забаненные; если в бане всё — фолбэк на первый из списка.
  const available = banned && banned.size > 0
    ? candidates.filter((id) => !banned.has(id))
    : candidates;
  if (available.length === 0) return candidates[0];

  // Мягкий приоритет: среди доступных (когда есть альтернативы) предпочитаем «помогло».
  if (preferred && preferred.size > 0 && available.length > 1) {
    const boosted = available.find((id) => preferred.has(id));
    if (boosted) return boosted;
  }
  return available[0];
};

export interface PracticeBanInput {
  practiceId: PracticeId;
  feedback: PracticeFeedback;
  timestamp: number;
}

/** Правило бана: «не помогло» в окне `banDays` дней → практика исключается. */
export const bannedPracticeIds = (
  feedback: PracticeBanInput[],
  now: Date,
  cfg: RecommendationConfig = DEFAULT_CONFIG
): Set<PracticeId> => {
  const cutoff = now.getTime() - cfg.banDays * 24 * 60 * 60 * 1000;
  const banned = new Set<PracticeId>();
  for (const e of feedback) {
    if (e.feedback === 'not_helped' && e.timestamp >= cutoff) banned.add(e.practiceId);
  }
  return banned;
};

/** Зеркало бана: «помогло» в окне `banDays` дней → практика получает мягкий приоритет. */
export const preferredPracticeIds = (
  feedback: PracticeBanInput[],
  now: Date,
  cfg: RecommendationConfig = DEFAULT_CONFIG
): Set<PracticeId> => {
  const cutoff = now.getTime() - cfg.banDays * 24 * 60 * 60 * 1000;
  const preferred = new Set<PracticeId>();
  for (const e of feedback) {
    if (e.feedback === 'helped' && e.timestamp >= cutoff) preferred.add(e.practiceId);
  }
  return preferred;
};
