import { EmotionKey, PlutchikVector, EmotionalGraphEntry } from '../../types';
import { findOilByName } from '../../data/oilDatabase';
import { EveningFeedbackEntry } from './effectiveness';

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

const KEYWORD_RULES: ReadonlyArray<{ emotion: EmotionKey; patterns: string[] }> = [
  { emotion: 'joy', patterns: ['😊', '😄', 'радост', 'отлич', 'счаст', 'весел', 'прекрасн', 'супер', 'люблю', 'класс', 'здорово'] },
  { emotion: 'trust', patterns: ['спокой', 'уверен', 'довер', 'расслаб', 'стабильн', 'благодар', 'умиротвор', 'безопасн'] },
  { emotion: 'fear', patterns: ['тревог', 'тревож', 'страх', 'страшн', 'волнен', 'боюс', 'паник', 'пережива', 'неуверен'] },
  { emotion: 'surprise', patterns: ['удивл', 'неожидан', 'внезапн', 'шок', 'пораж', 'вот это да'] },
  { emotion: 'sadness', patterns: ['😔', '😢', 'груст', 'устал', 'печал', 'тоск', 'плак', 'одинок', 'плохо', 'тяжело', 'опустош'] },
  { emotion: 'disgust', patterns: ['отвращ', 'противн', 'тошн', 'неприятн', 'мерзк', 'надоел'] },
  { emotion: 'anger', patterns: ['злюс', 'гнев', 'раздраж', 'бесит', 'злост', 'ярост', 'достал', 'ненавиж', 'зло'] },
  { emotion: 'anticipation', patterns: ['жду', 'скорее бы', 'предвкуш', 'ожида', 'начну', 'план', 'вперёд', 'готов'] },
];

/**
 * Определяет доминирующую эмоцию по тексту микроввода и строит текущий
 * вектор Плутчика: baseline с «приподнятой» доминантой.
 * Чистая функция, без сайд-эффектов.
 */
export const inferEmotionState = (
  microInput: string,
  baseline: PlutchikVector
): { vector: PlutchikVector; dominant: EmotionKey } => {
  const inputLower = microInput.toLowerCase();
  let dominant: EmotionKey = 'anticipation';

  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((p) => inputLower.includes(p))) {
      dominant = rule.emotion;
      break;
    }
  }

  const vector: PlutchikVector = {
    ...baseline,
    [dominant]: Math.min(1.0, (baseline[dominant] ?? 0.5) + DOMINANT_BUMP),
  };

  return { vector, dominant };
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
