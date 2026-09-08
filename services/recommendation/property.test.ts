import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { EmotionKey, PulseEntry, PracticeId } from '../../types';
import { EMOTION_KEYS, vectorDistance, classifyPulse, computeDailyVector, pulseGate } from './pulse';
import { inferEmotionState, DEFAULT_PLUTCHIK } from './inference';
import { computeStreakTransition } from './streak';
import { computeUnlockedFeatures } from './unlock';
import { selectPractice } from './practice';
import { colorForDominant, isValidHexColor } from './color';
import { PRACTICE_BY_ID } from '../../data/practices';

const toDateStr = (d: Date): string => d.toISOString().split('T')[0];

/** Генератор валидного вектора Плутчика (8 осей в [0,1], без NaN). */
const plutchikVector = () =>
  fc.record({
    joy: fc.float({ min: 0, max: 1, noNaN: true }),
    trust: fc.float({ min: 0, max: 1, noNaN: true }),
    fear: fc.float({ min: 0, max: 1, noNaN: true }),
    surprise: fc.float({ min: 0, max: 1, noNaN: true }),
    sadness: fc.float({ min: 0, max: 1, noNaN: true }),
    disgust: fc.float({ min: 0, max: 1, noNaN: true }),
    anger: fc.float({ min: 0, max: 1, noNaN: true }),
    anticipation: fc.float({ min: 0, max: 1, noNaN: true }),
  });

describe('property: inferEmotionState', () => {
  it('любой текст → доминанта из 8 эмоций и вектор в [0,1]', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const { vector, dominant } = inferEmotionState(text, DEFAULT_PLUTCHIK);
        expect(EMOTION_KEYS).toContain(dominant);
        for (const k of EMOTION_KEYS) {
          expect(vector[k]).toBeGreaterThanOrEqual(0);
          expect(vector[k]).toBeLessThanOrEqual(1);
        }
      }),
      { numRuns: 2000 }
    );
  });

  it('любой baseline в [0,1] → вектор не выходит за [0,1]', () => {
    fc.assert(
      fc.property(plutchikVector(), (baseline) => {
        const { vector, dominant } = inferEmotionState('', baseline);
        expect(EMOTION_KEYS).toContain(dominant);
        for (const k of EMOTION_KEYS) {
          expect(vector[k]).toBeGreaterThanOrEqual(0);
          expect(vector[k]).toBeLessThanOrEqual(1);
        }
      }),
      { numRuns: 2000 }
    );
  });
});

describe('property: pulse (vectorDistance / classifyPulse / computeDailyVector / pulseGate)', () => {
  it('vectorDistance ∈ [0,1] и симметрична', () => {
    fc.assert(
      fc.property(plutchikVector(), plutchikVector(), (a, b) => {
        const d = vectorDistance(a, b);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(1);
        expect(d).toBeCloseTo(vectorDistance(b, a), 10);
      })
    );
  });

  it('vectorDistance = 0 для идентичных векторов', () => {
    fc.assert(
      fc.property(plutchikVector(), (v) => {
        expect(vectorDistance(v, { ...v })).toBe(0);
      })
    );
  });

  it('classifyPulse → stable | shift', () => {
    fc.assert(
      fc.property(plutchikVector(), plutchikVector(), (anchor, current) => {
        expect(['stable', 'shift']).toContain(classifyPulse(anchor, current));
      })
    );
  });

  it('computeDailyVector → все оси в [0,1]', () => {
    fc.assert(
      fc.property(
        plutchikVector(),
        fc.integer({ min: 0, max: 10_000 }),
        fc.array(
          fc.record({
            vector: plutchikVector(),
            timestamp: fc.integer({ min: 0, max: 100_000 }),
          }),
          { maxLength: 8 }
        ),
        (anchorVector, anchorTs, pulses) => {
          const anchor = { vector: anchorVector, timestamp: anchorTs };
          const endTs = anchorTs + 1 + Math.max(0, ...pulses.map((p) => p.timestamp));
          const entries = pulses.map(
            (p) =>
              ({
                timestamp: p.timestamp,
                vector: p.vector,
                microInput: '',
                inputType: 'tap',
                dominant: 'joy' as EmotionKey,
                scenario: 'stable' as const,
                criticalShift: false,
              }) as PulseEntry
          );
          const daily = computeDailyVector(anchor, entries, endTs);
          for (const k of EMOTION_KEYS) {
            expect(daily[k]).toBeGreaterThanOrEqual(0);
            expect(daily[k]).toBeLessThanOrEqual(1);
          }
        }
      )
    );
  });

  it('pulseGate: allowed=false при лимите, cooldownRemaining ≥ 0', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100_000 }), { maxLength: 12 }),
        fc.integer({ min: 0, max: 100_000 }),
        (timestamps, now) => {
          const pulses = timestamps
            .sort((a, b) => a - b)
            .map((t) => ({ timestamp: t }) as PulseEntry);
          const gate = pulseGate(pulses, now);
          expect(gate.count).toBe(pulses.length);
          expect(gate.cooldownRemaining).toBeGreaterThanOrEqual(0);
          if (pulses.length >= 5) {
            expect(gate.allowed).toBe(false);
            expect(gate.reason).toBe('limit');
          }
        }
      )
    );
  });
});

describe('property: computeStreakTransition', () => {
  const dateArb = fc.date({
    min: new Date('2020-01-01'),
    max: new Date('2030-01-01'),
    noInvalidDate: true,
  });

  it('longest монотонно не убывает, current ≥ 1, lastActiveDate = today', () => {
    fc.assert(
      fc.property(
        fc.record({
          current: fc.integer({ min: 1, max: 1000 }),
          longest: fc.integer({ min: 1, max: 1000 }),
          lastActiveDate: dateArb,
        }),
        dateArb,
        (prev, todayDate) => {
          const before = {
            current: prev.current,
            longest: Math.max(prev.longest, prev.current),
            lastActiveDate: toDateStr(prev.lastActiveDate),
          };
          const today = toDateStr(todayDate);
          const next = computeStreakTransition(before, today);
          expect(next.longest).toBeGreaterThanOrEqual(before.longest);
          expect(next.current).toBeGreaterThanOrEqual(1);
          expect(next.lastActiveDate).toBe(today);
        }
      )
    );
  });
});

describe('property: computeUnlockedFeatures — фичи не закрываются с ростом дня', () => {
  const keys = ['eveningCheckin', 'mapDay', 'cards', 'patterns', 'catalog', 'exportPdf'] as const;

  it('монотонность по дню', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), fc.integer({ min: 1, max: 100 }), (a, b) => {
        const d1 = Math.min(a, b);
        const d2 = Math.max(a, b);
        const f1 = computeUnlockedFeatures(d1);
        const f2 = computeUnlockedFeatures(d2);
        for (const k of keys) {
          if (f1[k]) expect(f2[k]).toBe(true);
        }
      })
    );
  });
});

describe('комбинаторика selectPractice — 8 эмоций × {high, low}', () => {
  const valid = Object.keys(PRACTICE_BY_ID);

  it('каждая клетка возвращает валидную практику', () => {
    for (const emotion of EMOTION_KEYS) {
      for (const arousal of ['high', 'low'] as const) {
        expect(valid).toContain(selectPractice(emotion, arousal));
      }
    }
  });

  it('полный бан → всё равно валидная практика (фолбэк)', () => {
    const allBanned = new Set<PracticeId>(valid as PracticeId[]);
    for (const emotion of EMOTION_KEYS) {
      expect(valid).toContain(selectPractice(emotion, 'high', allBanned));
    }
  });
});

describe('property: colorForDominant — валидный hex для каждой эмоции', () => {
  it('все 8 цветов валидны', () => {
    for (const emotion of EMOTION_KEYS) {
      expect(isValidHexColor(colorForDominant(emotion))).toBe(true);
    }
  });
});
