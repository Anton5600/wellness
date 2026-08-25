import { PlutchikVector, OilEntry } from '../../types';
import { OIL_DATABASE } from '../../data/oilDatabase';
import { DEFAULT_CONFIG, RecommendationConfig } from './config';
import { bannedOilIds, EveningFeedbackEntry } from './effectiveness';
import { chronotypeForHour } from './chronotype';
import { classifyShape, strategyFor } from './wheelShape';

export interface CandidateShortlistInput {
  vector: PlutchikVector;
  hour: number;
  feedback: EveningFeedbackEntry[];
  oilDb?: OilEntry[];
  cfg?: RecommendationConfig;
  /** Точка отсчёта для окна бана; в проде — текущий момент. */
  now?: Date;
}

/**
 * Сборка шорт-листа масел-кандидатов:
 *   масла НЕ в бане → подходящие по хронотипу → ранжированные по числу
 *   совпадений с стратегией формы колеса.
 *
 * Всегда возвращает ≥1 масло (многоуровневый фолбэк).
 */
export const candidateShortlist = ({
  vector,
  hour,
  feedback,
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
    .map((oil) => {
      const matches = oil.effects.filter((eff) => eff.mode === strategy).length;
      return { oil, matches };
    })
    .filter((c) => c.matches > 0)
    .sort((a, b) => b.matches - a.matches);

  if (ranked.length > 0) return ranked.map((c) => c.oil);

  // Фолбэк 1: любое масло под текущий хронотип (вне бана).
  const byChrono = oilDb.filter((oil) => !banned.has(oil.id) && oil.chronotype.includes(chrono));
  if (byChrono.length > 0) return byChrono;

  // Фолбэк 2: любое масло вне бана (любой хронотип).
  const notBanned = oilDb.filter((oil) => !banned.has(oil.id));
  if (notBanned.length > 0) return notBanned;

  // Фолбэк 3: всё забанили — вернуть всё, чтобы рекомендация не была пустой.
  return oilDb;
};
