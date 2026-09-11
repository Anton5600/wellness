import { describe, it, expect, beforeEach } from 'vitest';
import { installMemoryStorage } from './localStorage';
import { stripUndefined, saveEmotionalGraphEntry } from '../services/firestoreService';
import { EmotionalGraphEntry } from '../types';

/**
 * Регрессия: `setDoc`/`updateDoc` бросают СИНХРОННО на `undefined` в данных
 * («Unsupported field value: undefined»), и этот бросок не ловится `Promise.catch`.
 * Запись чек-ина с опциональной диадой (`dyad`/`tomorrowTeaser` не заданы) роняла
 * весь ритуал на экране «Как вы себя чувствуете?».
 */

describe('stripUndefined', () => {
  it('вырезает undefined-поля, сохраняя остальные', () => {
    expect(stripUndefined({ a: 1, b: undefined, c: 'x' })).toEqual({ a: 1, c: 'x' });
  });

  it('рекурсивно чистит вложенные объекты', () => {
    expect(stripUndefined({ a: { b: undefined, c: 2 }, d: undefined })).toEqual({ a: { c: 2 } });
  });

  it('в массивах заменяет undefined на null, не сдвигая индексы', () => {
    expect(stripUndefined([1, undefined, 3])).toEqual([1, null, 3]);
    expect(stripUndefined([{ a: undefined }])).toEqual([{}]);
  });

  it('не трогает примитивы, Date и null', () => {
    const d = new Date('2026-09-11T00:00:00.000Z');
    expect(stripUndefined(d)).toBe(d);
    expect(stripUndefined(0)).toBe(0);
    expect(stripUndefined(null)).toBe(null);
    expect(stripUndefined(undefined)).toBe(undefined);
  });
});

describe('saveEmotionalGraphEntry', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  const entryWithoutDyad: EmotionalGraphEntry = {
    date: '2026-09-11',
    timestamp: Date.now(),
    microInput: 'устал и тяжело',
    inputType: 'tap',
    plutchikInferred: { joy: 0.3, trust: 0.4, fear: 0.3, surprise: 0.3, sadness: 0.7, disgust: 0.1, anger: 0.2, anticipation: 0.4 },
    dominant: 'sadness',
    aroma: 'Лаванда',
    aromaReason: 'Мягко снижает уровень кортизола.',
    insight: 'Дай себе 60 секунд тишины.',
    breathingPattern: 'box',
    dyad: undefined,
    tomorrowTeaser: undefined,
    breathingDone: false,
    stuckFlag: false,
  };

  it('не бросает при незаданных опциональных полях и кладёт запись в локальный кеш', async () => {
    const saved = await saveEmotionalGraphEntry('test-uid-regression', entryWithoutDyad);
    expect(saved.date).toBe('2026-09-11');
    expect(saved.dominant).toBe('sadness');
    const cached = JSON.parse(localStorage.getItem('compass_graph_test-uid-regression') ?? '{}');
    expect(cached['2026-09-11'].aroma).toBe('Лаванда');
  });
});
