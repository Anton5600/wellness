
import { EmotionKey, EmotionData, PlutchikVector } from '../types';
import { EMOTIONS } from '../constants';

export const VECTOR_FLOOR = 0.15;
export const VECTOR_SPAN = 0.85;

export const EMOTION_KEYS: EmotionKey[] = [
  'joy',
  'trust',
  'fear',
  'surprise',
  'sadness',
  'disgust',
  'anger',
  'anticipation',
];

/**
 * Строит стартовый вектор Плутчика из ответов квиза.
 *
 * Каждая эмоция получает `VECTOR_FLOOR + VECTOR_SPAN * (частота / всего ответов)`:
 * невыбранные эмоции остаются на минимальном фоне (VECTOR_FLOOR), а доминирующая
 * поднимается вплоть до 1.0, если выбрана во всех вопросах. Это «грубая» стартовая
 * позиция — в следующий раз профиль уточнится по реальным чек-инам.
 */
export const vectorFromAnswers = (answers: EmotionKey[]): PlutchikVector => {
  const total = answers.length || 1;
  const counts: Record<EmotionKey, number> = {
    joy: 0,
    trust: 0,
    fear: 0,
    surprise: 0,
    sadness: 0,
    disgust: 0,
    anger: 0,
    anticipation: 0,
  };

  for (const answer of answers) {
    counts[answer] = (counts[answer] ?? 0) + 1;
  }

  const vector = {} as PlutchikVector;
  for (const key of EMOTION_KEYS) {
    vector[key] = Math.min(1, VECTOR_FLOOR + VECTOR_SPAN * (counts[key] / total));
  }
  return vector;
};

/** Доминирующая эмоция — ключ с максимальным значением вектора. */
export const dominantEmotionOf = (vector: PlutchikVector): EmotionKey => {
  let best: EmotionKey = EMOTION_KEYS[0];
  let bestValue = -1;
  for (const key of EMOTION_KEYS) {
    if (vector[key] > bestValue) {
      bestValue = vector[key];
      best = key;
    }
  }
  return best;
};

export const calculateResult = (answers: EmotionKey[]): EmotionData => {
  if (answers.length === 0) {
    // Default to a neutral state if no answers are provided
    return EMOTIONS.anticipation;
  }

  const frequencyMap: Record<string, number> = {};
  for (const emotion of answers) {
    frequencyMap[emotion] = (frequencyMap[emotion] || 0) + 1;
  }

  let dominantEmotion: EmotionKey = answers[0];
  let maxCount = 0;

  for (const emotion in frequencyMap) {
    if (frequencyMap[emotion] > maxCount) {
      maxCount = frequencyMap[emotion];
      dominantEmotion = emotion as EmotionKey;
    }
  }

  return EMOTIONS[dominantEmotion];
};
