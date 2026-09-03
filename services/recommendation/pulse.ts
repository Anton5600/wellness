import { EmotionKey, PlutchikVector, PulseEntry, PulseScenario } from '../../types';

/**
 * Движок «Пульса дня» — чистая детерминированная логика повторного чекина состояния.
 * Сравнивает текущий вектор с утренним (Δ), вычисляет взвешенный по времени дневной
 * вектор и гейтит пульсы кулдауном/лимитом (защита от тревожного трекинга). Без LLM.
 */

/** Пороговые значения пульса. Стартовые значения — калибруются на реальных данных. */
export const PULSE_CONFIG = {
  /** Минимум минут между «Пульсами дня». */
  cooldownMinutes: 30,
  /** Максимум пульсов за день. */
  maxPerDay: 5,
  /** Начиная с этого чекина вопрос меняется с «что чувствуешь» на «что нужно». */
  focusSwitchAfter: 3,
  /** Порог «резкого сдвига»: max-abs-diff между векторами по 8 осям. */
  shiftThreshold: 0.35,
} as const;

export const EMOTION_KEYS: readonly EmotionKey[] = [
  'joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation',
];

/** Максимальная поэлементная разность двух векторов (0..1) — мера «дельты» состояния. */
export const vectorDistance = (a: PlutchikVector, b: PlutchikVector): number => {
  let max = 0;
  for (const key of EMOTION_KEYS) {
    const diff = Math.abs((a[key] ?? 0.5) - (b[key] ?? 0.5));
    if (diff > max) max = diff;
  }
  return max;
};

/** A (стабильно) / B (резкий сдвиг) по порогу `shiftThreshold`. */
export const classifyPulse = (anchor: PlutchikVector, current: PlutchikVector): PulseScenario =>
  vectorDistance(anchor, current) >= PULSE_CONFIG.shiftThreshold ? 'shift' : 'stable';

/**
 * Взвешенный по времени дневной вектор (Time-Weighted Average):
 *   dailyVector = Σ(vector_i × duration_i) / totalDuration
 * где duration_i — время между соседними чекинами, последний сегмент — до `endTs`.
 */
export const computeDailyVector = (
  anchor: { vector: PlutchikVector; timestamp: number },
  pulses: PulseEntry[],
  endTs: number
): PlutchikVector => {
  const points: Array<{ vector: PlutchikVector; at: number }> = [
    { vector: anchor.vector, at: anchor.timestamp },
    ...pulses.map((p) => ({ vector: p.vector, at: p.timestamp })),
  ].sort((a, b) => a.at - b.at);

  const acc: PlutchikVector = {
    joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0,
  };
  let total = 0;

  for (let i = 0; i < points.length; i++) {
    const next = i + 1 < points.length ? points[i + 1].at : endTs;
    const duration = next - points[i].at;
    if (duration <= 0) continue;
    for (const key of EMOTION_KEYS) {
      acc[key] += (points[i].vector[key] ?? 0.5) * duration;
    }
    total += duration;
  }

  if (total <= 0) return { ...anchor.vector };

  const result = { ...anchor.vector };
  for (const key of EMOTION_KEYS) {
    result[key] = acc[key] / total;
  }
  return result;
};

export interface PulseGateResult {
  allowed: boolean;
  reason?: 'cooldown' | 'limit';
  /** Число уже записанных пульсов за день. */
  count: number;
  /** Минут до снятия кулдауна (0, если кулдаун не действует). */
  cooldownRemaining: number;
}

/** Кулдаун/лимит пульса. `now` — текущий момент (ms), `pulses` — уже записанные за день. */
export const pulseGate = (pulses: PulseEntry[], now: number): PulseGateResult => {
  const count = pulses.length;
  if (count >= PULSE_CONFIG.maxPerDay) {
    return { allowed: false, reason: 'limit', count, cooldownRemaining: 0 };
  }
  if (count > 0) {
    const last = pulses[pulses.length - 1].timestamp;
    const elapsed = now - last;
    const cooldownMs = PULSE_CONFIG.cooldownMinutes * 60 * 1000;
    if (elapsed < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - elapsed) / 60000);
      return { allowed: false, reason: 'cooldown', count, cooldownRemaining: remaining };
    }
  }
  return { allowed: true, count, cooldownRemaining: 0 };
};
