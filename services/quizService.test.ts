import { describe, it, expect } from 'vitest';
import { EmotionKey } from '../types';
import {
  vectorFromAnswers,
  dominantEmotionOf,
  VECTOR_FLOOR,
  VECTOR_SPAN,
  EMOTION_KEYS,
} from './quizService';

const ALL_EMOTIONS: EmotionKey[] = [...EMOTION_KEYS];

describe('vectorFromAnswers', () => {
  it('все 8 эмоций покрыты, значения в диапазоне [0,1]', () => {
    const vector = vectorFromAnswers(['joy', 'fear']);
    expect(Object.keys(vector).sort()).toEqual([...EMOTION_KEYS].sort());
    for (const key of EMOTION_KEYS) {
      expect(vector[key]).toBeGreaterThanOrEqual(0);
      expect(vector[key]).toBeLessThanOrEqual(1);
    }
  });

  it('пустой список не падает и даёт равномерный фон', () => {
    const vector = vectorFromAnswers([]);
    for (const key of EMOTION_KEYS) {
      expect(vector[key]).toBe(VECTOR_FLOOR);
    }
  });

  it('одна эмоция во всех ответах дотягивается до 1.0', () => {
    const vector = vectorFromAnswers(['joy', 'joy', 'joy']);
    expect(vector.joy).toBeCloseTo(1, 5);
    expect(vector.fear).toBe(VECTOR_FLOOR);
  });

  it('частота масштабируется: 1 из 2 даёт полшага от фона', () => {
    const vector = vectorFromAnswers(['joy', 'sadness']);
    expect(vector.joy).toBeCloseTo(VECTOR_FLOOR + VECTOR_SPAN / 2, 5);
    expect(vector.sadness).toBeCloseTo(VECTOR_FLOOR + VECTOR_SPAN / 2, 5);
  });

  it('доминанта совпадает с самой частой эмоцией', () => {
    const vector = vectorFromAnswers(['fear', 'fear', 'joy', 'sadness', 'fear']);
    expect(dominantEmotionOf(vector)).toBe('fear');
  });

  it('при ничьей выбирается первая по порядку EMOTION_KEYS', () => {
    const vector = vectorFromAnswers(['joy', 'trust']);
    expect(dominantEmotionOf(vector)).toBe('joy');
  });
});

describe('dominantEmotionOf', () => {
  it('возвращает ключ с максимальным значением', () => {
    const vector = { ...vectorFromAnswers(['anger', 'anger']), anger: 0.9 } as ReturnType<
      typeof vectorFromAnswers
    >;
    expect(dominantEmotionOf(vector)).toBe('anger');
  });

  it('не выходит за пределы 8 ключей', () => {
    expect(ALL_EMOTIONS).toContain(dominantEmotionOf(vectorFromAnswers(['disgust'])));
  });
});
