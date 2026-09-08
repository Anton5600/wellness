import { EmotionKey, MixedEmotion } from '../../types';
import { PLUTCHIK_ORDER } from './wheelShape';

/**
 * Первичные диады Плутчика: две соседние по колесу эмоции, активные одновременно,
 * дают сложное чувство. Пары заданы в каноническом порядке (по `PLUTCHIK_ORDER`).
 */
export const DYADS: readonly MixedEmotion[] = [
  { key: 'love', label: 'Любовь', emotions: ['joy', 'trust'] },
  { key: 'submission', label: 'Покорность', emotions: ['trust', 'fear'] },
  { key: 'alarm', label: 'Испуг', emotions: ['fear', 'surprise'] },
  { key: 'disappointment', label: 'Недоверие', emotions: ['surprise', 'sadness'] },
  { key: 'remorse', label: 'Горечь', emotions: ['sadness', 'disgust'] },
  { key: 'contempt', label: 'Презрение', emotions: ['disgust', 'anger'] },
  { key: 'aggressiveness', label: 'Агрессивная надежда', emotions: ['anger', 'anticipation'] },
  { key: 'optimism', label: 'Оптимизм', emotions: ['anticipation', 'joy'] },
];

const N = PLUTCHIK_ORDER.length;

/** Лежат ли две эмоции рядом по колесу (с учётом циклической пары anticipation↔joy). */
export const isAdjacent = (a: EmotionKey, b: EmotionKey): boolean => {
  const ia = PLUTCHIK_ORDER.indexOf(a);
  const ib = PLUTCHIK_ORDER.indexOf(b);
  const d = Math.abs(ia - ib);
  return d === 1 || d === N - 1;
};

/** Находит диаду по неупорядоченной паре эмоций; `null`, если пара не смежна. */
export const dyadFor = (a: EmotionKey, b: EmotionKey): MixedEmotion | null =>
  DYADS.find(
    (d) =>
      (d.emotions[0] === a && d.emotions[1] === b) ||
      (d.emotions[0] === b && d.emotions[1] === a)
  ) ?? null;
