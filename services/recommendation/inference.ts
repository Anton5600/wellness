import { EmotionKey, PlutchikVector, EmotionalGraphEntry, MixedEmotion } from '../../types';
import { findOilByName } from '../../data/oilDatabase';
import { EveningFeedbackEntry } from './effectiveness';
import { isAdjacent, dyadFor } from './dyads';
import { PLUTCHIK_ORDER } from './wheelShape';

/** Русские подписи эмоций (для шаблонных текстов и LLM-промптов). */
export const EMOTION_LABELS: Record<EmotionKey, string> = {
  joy: 'Радость',
  trust: 'Доверие',
  fear: 'Страх',
  surprise: 'Удивление',
  sadness: 'Грусть',
  disgust: 'Отвращение',
  anger: 'Гнев',
  anticipation: 'Ожидание',
};

/** Стартовый (нейтральный) профиль Плутчика. */
export const DEFAULT_PLUTCHIK: PlutchikVector = {
  joy: 0.5,
  trust: 0.6,
  fear: 0.2,
  surprise: 0.3,
  sadness: 0.2,
  disgust: 0.1,
  anger: 0.2,
  anticipation: 0.6,
};

/** На сколько поднимаем доминирующую эмоцию относительно baseline. */
export const DOMINANT_BUMP = 0.2;

/** Валидирует, что значение — одна из 8 эмоций Плутчика. */
export const isEmotionKey = (value: unknown): value is EmotionKey =>
  typeof value === 'string' && value in EMOTION_LABELS;

/** «Любовь (Радость + Доверие)» — подпись диады для UI и LLM-промптов. */
export const dyadLabel = (dyad: MixedEmotion): string =>
  `${dyad.label} (${EMOTION_LABELS[dyad.emotions[0]]} + ${EMOTION_LABELS[dyad.emotions[1]]})`;

/**
 * Строит «текущий» вектор из baseline: доминанта поднята так, чтобы быть визуально
 * главной осью колеса (не ниже максимума остальных осей + DOMINANT_BUMP), но не выше 1.0.
 * Раньше доминанту просто прибавляли к baseline — при «тяжёлом» хроническом профиле
 * колесо всё равно выпячивалось в сторону baseline, а не текущего состояния.
 */
export const bumpDominant = (baseline: PlutchikVector, dominant: EmotionKey): PlutchikVector => {
  const base = baseline[dominant] ?? 0.5;
  const maxOther = (Object.keys(baseline) as EmotionKey[])
    .filter((k) => k !== dominant)
    .reduce((m, k) => Math.max(m, baseline[k] ?? 0.5), 0);
  return {
    ...baseline,
    [dominant]: Math.min(1.0, Math.max(base + DOMINANT_BUMP, maxOther + DOMINANT_BUMP)),
  };
};

/**
 * То же, что `bumpDominant`, но для диады: обе оси `a` и `b` подняты так, чтобы быть
 * главными осями колеса (не ниже максимума остальных + DOMINANT_BUMP), не выше 1.0.
 */
export const bumpPair = (baseline: PlutchikVector, a: EmotionKey, b: EmotionKey): PlutchikVector => {
  const baseA = baseline[a] ?? 0.5;
  const baseB = baseline[b] ?? 0.5;
  const maxOther = (Object.keys(baseline) as EmotionKey[])
    .filter((k) => k !== a && k !== b)
    .reduce((m, k) => Math.max(m, baseline[k] ?? 0.5), 0);
  return {
    ...baseline,
    [a]: Math.min(1.0, Math.max(baseA + DOMINANT_BUMP, maxOther + DOMINANT_BUMP)),
    [b]: Math.min(1.0, Math.max(baseB + DOMINANT_BUMP, maxOther + DOMINANT_BUMP)),
  };
};

const KEYWORD_RULES: ReadonlyArray<{ emotion: EmotionKey; patterns: string[] }> = [
  { emotion: 'joy', patterns: ['😊', '😄', 'радост', 'отлич', 'счаст', 'весел', 'прекрасн', 'супер', 'люблю', 'класс', 'здорово', 'бодр', 'заряж', 'драйв'] },
  { emotion: 'trust', patterns: ['спокой', 'уверен', 'довер', 'расслаб', 'стабильн', 'благодар', 'умиротвор', 'безопасн'] },
  { emotion: 'fear', patterns: ['тревог', 'тревож', 'страх', 'страшн', 'волнен', 'боюс', 'паник', 'пережива', 'неуверен', 'неспокой', 'неспокоен'] },
  { emotion: 'surprise', patterns: ['удивл', 'неожидан', 'внезапн', 'шок', 'пораж', 'вот это да'] },
  { emotion: 'sadness', patterns: ['😔', '😢', 'груст', 'устал', 'печал', 'тоск', 'плак', 'одинок', 'плохо', 'тяжело', 'опустош'] },
  { emotion: 'disgust', patterns: ['отвращ', 'противн', 'тошн', 'неприятн', 'мерзк', 'надоел'] },
  { emotion: 'anger', patterns: ['злюс', 'гнев', 'раздраж', 'бесит', 'злост', 'ярост', 'достал', 'ненавиж', 'зло'] },
  { emotion: 'anticipation', patterns: ['жду', 'скорее бы', 'предвкуш', 'ожида', 'начну', 'план', 'вперёд', 'готов', 'действ', 'старт'] },
];

/**
 * Определяет доминирующую эмоцию по тексту микроввода и строит текущий
 * вектор Плутчика: baseline с «приподнятой» доминантой.
 * Чистая функция, без сайд-эффектов.
 */
/**
 * Проверяет, встречается ли `pattern` в `input` как самостоятельное слово-ядро,
 * а не как часть отрицания «не…» (например, «неспокойно» не должно считаться
 * «спокойно», «неуверен» — «уверен»).
 */
const hasKeyword = (input: string, pattern: string): boolean => {
  let idx = input.indexOf(pattern);
  while (idx !== -1) {
    const prefix = input.slice(Math.max(0, idx - 2), idx);
    if (!prefix.endsWith('не')) return true;
    idx = input.indexOf(pattern, idx + 1);
  }
  return false;
};

/**
 * Считает «вес» каждой эмоции по тексту микроввода: сколько паттернов совпало
 * (через `hasKeyword`, с гвардом отрицаний «не…»). Нулевой вес — эмоция не выражена.
 */
export const scoreEmotions = (inputLower: string): Record<EmotionKey, number> => {
  const scores = {} as Record<EmotionKey, number>;
  for (const rule of KEYWORD_RULES) {
    scores[rule.emotion] = rule.patterns.filter((p) => hasKeyword(inputLower, p)).length;
  }
  return scores;
};

export const inferEmotionState = (
  microInput: string,
  baseline: PlutchikVector
): { vector: PlutchikVector; dominant: EmotionKey; dyad?: MixedEmotion } => {
  const inputLower = microInput.toLowerCase();
  const scores = scoreEmotions(inputLower);

  // Эмоции с ненулевым весом, отсортированные по (вес desc, порядок колеса asc).
  const matched = (Object.keys(scores) as EmotionKey[])
    .filter((e) => scores[e] > 0)
    .sort((a, b) => scores[b] - scores[a] || PLUTCHIK_ORDER.indexOf(a) - PLUTCHIK_ORDER.indexOf(b));

  const dominant: EmotionKey = matched[0] ?? 'anticipation';
  const dyad = matched.length >= 2 && isAdjacent(matched[0], matched[1])
    ? dyadFor(matched[0], matched[1]) ?? undefined
    : undefined;

  const vector = dyad
    ? bumpPair(baseline, dyad.emotions[0], dyad.emotions[1])
    : bumpDominant(baseline, dominant);

  return dyad ? { vector, dominant, dyad } : { vector, dominant };
};

/**
 * Преобразует историю дневника в записи вечерних отзывов для правил бана.
 * Использует `aromaId` (если есть), иначе находит id по имени масла (без регистра).
 */
export const buildFeedbackEntries = (
  history: Array<Partial<EmotionalGraphEntry> | null | undefined>
): EveningFeedbackEntry[] => {
  if (!Array.isArray(history)) return [];
  const entries: EveningFeedbackEntry[] = [];

  for (const h of history) {
    if (!h || !h.eveningFeedback || typeof h.timestamp !== 'number') continue;
    const oilId = h.aromaId ?? findOilByName(h.aroma ?? '')?.id;
    if (!oilId) continue;
    entries.push({ oilId, feedback: h.eveningFeedback, timestamp: h.timestamp });
  }

  return entries;
};
