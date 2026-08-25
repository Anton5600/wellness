import { PlutchikVector, OilEntry, EffectMode, EmotionKey } from '../../types';
import { OIL_DATABASE } from '../../data/oilDatabase';
import { DEFAULT_CONFIG, RecommendationConfig } from './config';
import { bannedOilIds, EveningFeedbackEntry } from './effectiveness';
import { chronotypeForHour } from './chronotype';
import { classifyShape, strategyFor } from './wheelShape';

/**
 * Совместимость режима масла со стратегией.
 * Стратегия `balance` принимает и `calm` — «успокоить перегретый полюс»
 * и «сбалансировать вниз» для правил равнозначны.
 */
const modeMatchesStrategy = (mode: EffectMode, strategy: EffectMode): boolean => {
  if (mode === strategy) return true;
  return strategy === 'balance' && mode === 'calm';
};

/** 1, если у масла есть эффект на доминирующую эмоцию; иначе 0. */
const emotionMatch = (oil: OilEntry, dominant?: EmotionKey): number =>
  dominant && oil.effects.some((eff) => eff.emotion === dominant) ? 1 : 0;

export interface CandidateShortlistInput {
  vector: PlutchikVector;
  hour: number;
  feedback: EveningFeedbackEntry[];
  /** Доминирующая эмоция — тибрекает ранжирование (если не задана, только по mode). */
  dominant?: EmotionKey;
  oilDb?: OilEntry[];
  cfg?: RecommendationConfig;
  /** Точка отсчёта для окна бана; в проде — текущий момент. */
  now?: Date;
}

/**
 * Сборка шорт-листа масел-кандидатов:
 *   масла НЕ в бане → подходящие по хронотипу → ранжированные по числу
 *   совпадений с стратегией формы колеса, затем по нацеленности на доминанту.
 *
 * Всегда возвращает ≥1 масло (многоуровневый фолбэк).
 */
export const candidateShortlist = ({
  vector,
  hour,
  feedback,
  dominant,
  oilDb = OIL_DATABASE,
  cfg = DEFAULT_CONFIG,
  now,
}: CandidateShortlistInput): OilEntry[] => {
  const banned = bannedOilIds(feedback, now ?? new Date(), cfg);
  const strategy = strategyFor(classifyShape(vector, cfg));
  const chrono = chronotypeForHour(hour);

  const ranked = oilDb
    .filter((oil) => !banned.has(oil.id))
    .filter((oil) => oil.chronotype.includes(chrono))
    .map((oil) => ({
      oil,
      matches: oil.effects.filter((eff) => modeMatchesStrategy(eff.mode, strategy)).length,
      emotion: emotionMatch(oil, dominant),
    }))
    .filter((c) => c.matches > 0)
    .sort((a, b) => b.matches - a.matches || b.emotion - a.emotion);

  if (ranked.length > 0) return ranked.map((c) => c.oil);

  // Фолбэк 1: любое масло под хронотип (вне бана), предпочитая нацеленные на доминанту.
  const byChrono = oilDb
    .filter((oil) => !banned.has(oil.id) && oil.chronotype.includes(chrono))
    .sort((a, b) => emotionMatch(b, dominant) - emotionMatch(a, dominant));
  if (byChrono.length > 0) return byChrono;

  // Фолбэк 2: любое масло вне бана (любой хронотип).
  const notBanned = oilDb
    .filter((oil) => !banned.has(oil.id))
    .sort((a, b) => emotionMatch(b, dominant) - emotionMatch(a, dominant));
  if (notBanned.length > 0) return notBanned;

  // Фолбэк 3: всё забанили — вернуть всё, чтобы рекомендация не была пустой.
  return oilDb;
};
