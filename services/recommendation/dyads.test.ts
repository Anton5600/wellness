import { describe, it, expect } from 'vitest';
import { EmotionKey } from '../../types';
import { DYADS, isAdjacent, dyadFor } from './dyads';
import { dyadLabel } from './inference';

describe('DYADS', () => {
  it('8 диад, каждая с двумя разными смежными эмоциями', () => {
    expect(DYADS).toHaveLength(8);
    for (const d of DYADS) {
      expect(d.emotions[0]).not.toBe(d.emotions[1]);
      expect(isAdjacent(d.emotions[0], d.emotions[1])).toBe(true);
    }
  });

  it('покрывает все 8 смежных пар колеса', () => {
    const keys = new Set(DYADS.map((d) => d.key));
    expect(keys.size).toBe(8);
  });
});

describe('isAdjacent', () => {
  it('смежные пары → true', () => {
    expect(isAdjacent('joy', 'trust')).toBe(true);
    expect(isAdjacent('trust', 'fear')).toBe(true);
    expect(isAdjacent('anger', 'anticipation')).toBe(true);
  });

  it('циклическая пара anticipation↔joy → true', () => {
    expect(isAdjacent('anticipation', 'joy')).toBe(true);
    expect(isAdjacent('joy', 'anticipation')).toBe(true);
  });

  it('несмежные → false', () => {
    expect(isAdjacent('joy', 'fear')).toBe(false);
    expect(isAdjacent('joy', 'anger')).toBe(false);
    expect(isAdjacent('trust', 'disgust')).toBe(false);
  });

  it('одна и та же эмоция → false', () => {
    expect(isAdjacent('joy', 'joy')).toBe(false);
  });
});

describe('dyadFor', () => {
  it('возвращает диаду в обоих порядках', () => {
    const love = dyadFor('joy', 'trust');
    expect(love?.key).toBe('love');
    expect(dyadFor('trust', 'joy')?.key).toBe('love');
  });

  it('все 8 пар распознаются по обеим эмоциям', () => {
    for (const d of DYADS) {
      const [a, b] = d.emotions;
      expect(dyadFor(a, b)?.key).toBe(d.key);
      expect(dyadFor(b, a)?.key).toBe(d.key);
    }
  });

  it('несмежная пара → null', () => {
    expect(dyadFor('joy', 'fear')).toBeNull();
  });
});

describe('dyadLabel', () => {
  it('форматирует «Любовь (Радость + Доверие)»', () => {
    const love = dyadFor('joy', 'trust')!;
    expect(dyadLabel(love)).toBe('Любовь (Радость + Доверие)');
  });

  it('содержит обе русские подписи эмоций', () => {
    for (const d of DYADS) {
      const label = dyadLabel(d);
      expect(label).toContain(d.label);
      expect(label).toContain('(');
      expect(label).toContain(' + ');
    }
  });
});

// Утилита для type-check: EmotionKey остаётся валидным для обеих осей диады.
const assertEmotionKey = (_e: EmotionKey): void => undefined;
it('эмоции диад — валидные EmotionKey', () => {
  for (const d of DYADS) {
    assertEmotionKey(d.emotions[0]);
    assertEmotionKey(d.emotions[1]);
  }
});
