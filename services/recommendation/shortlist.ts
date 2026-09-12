import { PlutchikVector, OilEntry, EffectMode, EmotionKey, MixedEmotion } from '../../types';
import { OIL_DATABASE } from '../../data/oilDatabase';
import { oilsForEmotion } from '../../data/emotionOils';
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

/** Число целевых эмоций (доминанта, либо обе эмоции диады), на которые есть эффект у масла. */
const emotionCoverage = (oil: OilEntry, targets: EmotionKey[]): number =>
  targets.filter((t) => oil.effects.some((eff) => eff.emotion === t)).length;

/** Целевые эмоции для ранжирования: при диаде — обе её эмоции, иначе — доминанта. */
const coverageTargets = (dominant?: EmotionKey, dyad?: MixedEmotion): EmotionKey[] =>
  dyad ? [dyad.emotions[0], dyad.emotions[1]] : dominant ? [dominant] : [];

export interface CandidateShortlistInput {
  vector: PlutchikVector;
  hour: number;
  feedback: EveningFeedbackEntry[];
  /** Доминирующая эмоция — тибрекает ранжирование (если не задана, только по mode). */
  dominant?: EmotionKey;
  /** Смешанная эмоция — ранжирует выше масла, закрывающие ОБЕ эмоции пары. */
  dyad?: MixedEmotion;
  oilDb?: OilEntry[];
  cfg?: RecommendationConfig;
  /** Точка отсчёта для окна бана; в проде — текущий момент. */
  now?: Date;
  /** Применённый паттерн «вечером тяжелее» → успокаивающие масла получают приоритет. */
  eveningHarder?: boolean;
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
  dyad,
  oilDb = OIL_DATABASE,
  cfg = DEFAULT_CONFIG,
  now,
  eveningHarder = false,
}: CandidateShortlistInput): OilEntry[] => {
  const banned = bannedOilIds(feedback, now ?? new Date(), cfg);
  const chrono = chronotypeForHour(hour);

  // Диада (смешанная эмоция): шорт-лист — масла, у которых диада подобрана явно (поле `dyads`).
  // Прямая привязка надёжнее подбора по `effects`: стратегия формы колеса для вектора диады
  // часто даёт «support» и отсеивает «awaken»-масла (Лайм, Имбирь, Мотивация), не попадающие
  // под неё. Хронотип здесь — мягкий сигнал (масла под текущее время суток выше), а не фильтр:
  // курированные пользователем масла диады не роняем (хронотип — инференция из описаний).
  if (dyad) {
    const forDyad = oilDb.filter((oil) => !banned.has(oil.id) && oil.dyads?.includes(dyad.key));
    if (forDyad.length > 0) {
      return forDyad.sort((a, b) => {
        const aIn = a.chronotype.includes(chrono) ? 1 : 0;
        const bIn = b.chronotype.includes(chrono) ? 1 : 0;
        if (aIn !== bIn) return bIn - aIn; // под текущее время суток — выше
        return (a.dyads?.length ?? 0) - (b.dyads?.length ?? 0); // затем — самые «узкие» (одна диада)
      });
    }
  }

  // Жёсткая привязка «эмоция → масло»: главное масло эмоции и дополнительные варианты
  // из источников идут первыми, в заданном порядке. Хронотип здесь не фильтр, а сигнал
  // (как в ветке диад): курированное масло не должно выпадать из-за времени суток.
  const mapped = dominant && !dyad
    ? oilsForEmotion(dominant)
        .map((id) => oilDb.find((o) => o.id === id))
        .filter((o): o is OilEntry => Boolean(o) && !banned.has(o.id))
    : [];
  const mappedIds = new Set(mapped.map((o) => o.id));

  const strategy = strategyFor(classifyShape(vector, cfg));
  const targets = coverageTargets(dominant, dyad);

  const ranked = oilDb
    .filter((oil) => !banned.has(oil.id) && !mappedIds.has(oil.id))
    .filter((oil) => oil.chronotype.includes(chrono))
    .map((oil) => ({
      oil,
      // «Вечером тяжелее»: успокаивающие (calm) эффекты учитываем как подходящие,
      // даже если стратегия формы колеса их не требует — предупреждаем вечерний спад.
      matches: oil.effects.filter(
        (eff) => modeMatchesStrategy(eff.mode, strategy) || (eveningHarder && eff.mode === 'calm')
      ).length,
      coverage: emotionCoverage(oil, targets),
    }))
    .filter((c) => c.matches > 0)
    // Сначала покрытие целевой эмоции, потом совпадение по режиму: масло, которое реально
    // работает с доминантой, должно обгонять универсальное «подходящее по форме колеса».
    .sort((a, b) => b.coverage - a.coverage || b.matches - a.matches);

  if (mapped.length > 0 || ranked.length > 0) {
    return [...mapped, ...ranked.map((c) => c.oil)];
  }

  // Фолбэк 1: любое масло под хронотип (вне бана), предпочитая нацеленные на целевые эмоции.
  const byChrono = oilDb
    .filter((oil) => !banned.has(oil.id) && oil.chronotype.includes(chrono))
    .sort((a, b) => emotionCoverage(b, targets) - emotionCoverage(a, targets));
  if (byChrono.length > 0) return byChrono;

  // Фолбэк 2: любое масло вне бана (любой хронотип).
  const notBanned = oilDb
    .filter((oil) => !banned.has(oil.id))
    .sort((a, b) => emotionCoverage(b, targets) - emotionCoverage(a, targets));
  if (notBanned.length > 0) return notBanned;

  // Фолбэк 3: всё забанили — вернуть всё, чтобы рекомендация не была пустой.
  return oilDb;
};
