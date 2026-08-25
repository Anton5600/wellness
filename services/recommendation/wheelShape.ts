import { PlutchikVector, EffectMode } from '../../types';
import { DEFAULT_CONFIG, RecommendationConfig } from './config';

export type WheelShape = 'star' | 'crescent' | 'circle';

/** Порядок эмоций по колесу Плутчика (соседние — смежные). */
export const PLUTCHIK_ORDER = [
  'joy',
  'trust',
  'fear',
  'surprise',
  'sadness',
  'disgust',
  'anger',
  'anticipation',
] as const;

const N = PLUTCHIK_ORDER.length;

/** Лежат ли все индексы в одной смежной (циклической) дуге размером ≤ maxPositions. */
const isContiguousArc = (indices: number[], maxPositions: number): boolean => {
  if (indices.length === 0) return false;
  const sorted = [...indices].sort((a, b) => a - b);
  for (const start of sorted) {
    const maxDist = Math.max(...sorted.map((idx) => (idx - start + N) % N));
    if (maxDist <= maxPositions - 1) return true;
  }
  return false;
};

/** Пуста ли дуга, противоположная доминантам (все антиподы ниже порога). */
const oppositeArcEmpty = (vals: number[], highIdx: number[], low: number): boolean => {
  const opposites = new Set(highIdx.map((i) => (i + N / 2) % N));
  return [...opposites].every((i) => vals[i] < low);
};

/**
 * Классификация формы колеса Плутчика:
 *   circle   — значения близки к равномерным (низкий разброс);
 *   crescent — доминанты сконцентрированы в смежной дуге ≤ maxArcPositions,
 *              противоположная дуга пуста (полумесяц на одной стороне);
 *   star     — 2–3 доминанты разбросаны (не в одной дуге), остальные спят;
 *   circle   — фолбэк по умолчанию.
 */
export const classifyShape = (
  v: PlutchikVector,
  cfg: RecommendationConfig = DEFAULT_CONFIG
): WheelShape => {
  const vals = PLUTCHIK_ORDER.map((e) => v[e] ?? 0);
  const spread = Math.max(...vals) - Math.min(...vals);

  if (spread <= cfg.circleSpreadThreshold) return 'circle';

  const highIdx: number[] = [];
  vals.forEach((val, i) => {
    if (val >= cfg.dominanceThreshold) highIdx.push(i);
  });
  const highCount = highIdx.length;

  if (
    highCount >= 1 &&
    isContiguousArc(highIdx, cfg.maxArcPositions) &&
    oppositeArcEmpty(vals, highIdx, cfg.restThreshold)
  ) {
    return 'crescent';
  }

  if (highCount >= 2 && highCount <= 3) {
    const restLow = vals.every((val, i) => highIdx.includes(i) || val < cfg.restThreshold);
    if (restLow) return 'star';
  }

  return 'circle';
};

/** Стратегия подбора масла по форме колеса. */
export const strategyFor = (shape: WheelShape): EffectMode => {
  switch (shape) {
    case 'star':
      return 'awaken';
    case 'crescent':
      return 'balance';
    case 'circle':
      return 'support';
  }
};
