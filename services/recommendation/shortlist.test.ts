import { describe, it, expect } from 'vitest';
import { PlutchikVector, OilEntry } from '../../types';
import { OIL_DATABASE } from '../../data/oilDatabase';
import { candidateShortlist } from './shortlist';

const vec = (overrides: Partial<PlutchikVector>): PlutchikVector => ({
  joy: 0,
  trust: 0,
  fear: 0,
  surprise: 0,
  sadness: 0,
  disgust: 0,
  anger: 0,
  anticipation: 0,
  ...overrides,
});

const star = vec({ joy: 0.8, sadness: 0.8 });
const crescent = vec({ joy: 0.8, trust: 0.75, fear: 0.65 });
const circle = vec({ joy: 0.5, trust: 0.5, fear: 0.5, surprise: 0.5, sadness: 0.5, disgust: 0.5, anger: 0.5, anticipation: 0.5 });

const fixture: OilEntry[] = [
  { id: 'a_awaken', name: 'A', description: '', icon: '', effects: [{ emotion: 'joy', mode: 'awaken' }], chronotype: ['morning'], instruction: '' },
  { id: 'b_balance', name: 'B', description: '', icon: '', effects: [{ emotion: 'sadness', mode: 'balance' }], chronotype: ['morning', 'evening'], instruction: '' },
  { id: 'c_calm', name: 'C', description: '', icon: '', effects: [{ emotion: 'trust', mode: 'calm' }], chronotype: ['evening'], instruction: '' },
  { id: 'd_support', name: 'D', description: '', icon: '', effects: [{ emotion: 'disgust', mode: 'support' }], chronotype: ['day'], instruction: '' },
];

describe('candidateShortlist', () => {
  it('star → awaken, утро → только awaken-масло утра', () => {
    const ids = candidateShortlist({ vector: star, hour: 8, feedback: [], oilDb: fixture }).map((o) => o.id);
    expect(ids).toContain('a_awaken');
    expect(ids).not.toContain('b_balance');
  });

  it('crescent → balance → balance-масло', () => {
    const ids = candidateShortlist({ vector: crescent, hour: 8, feedback: [], oilDb: fixture }).map((o) => o.id);
    expect(ids).toEqual(['b_balance']);
  });

  it('circle → support, день → support-масло дня', () => {
    const ids = candidateShortlist({ vector: circle, hour: 14, feedback: [], oilDb: fixture }).map((o) => o.id);
    expect(ids).toEqual(['d_support']);
  });

  it('масло в бане исключается из шорт-листа', () => {
    const ids = candidateShortlist({
      vector: star,
      hour: 8,
      feedback: [{ oilId: 'a_awaken', feedback: 'worse', timestamp: Date.now() - 1000 }],
      oilDb: fixture,
    }).map((o) => o.id);
    expect(ids).not.toContain('a_awaken');
    expect(ids.length).toBeGreaterThan(0);
  });

  it('всё забанили → всё равно непустой фолбэк', () => {
    const allBanned = fixture.map((o) => ({ oilId: o.id, feedback: 'worse' as const, timestamp: Date.now() - 1000 }));
    const result = candidateShortlist({ vector: star, hour: 8, feedback: allBanned, oilDb: fixture });
    expect(result.length).toBe(fixture.length);
  });

  it('реальная база всегда даёт ≥1 масло', () => {
    const result = candidateShortlist({ vector: star, hour: 8, feedback: [], oilDb: OIL_DATABASE });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('ранжирует выше масло, нацеленное на доминирующую эмоцию', () => {
    const oils: OilEntry[] = [
      { id: 'fear_balance', name: 'F', description: '', icon: '', effects: [{ emotion: 'fear', mode: 'balance' }], chronotype: ['morning'], instruction: '' },
      { id: 'sad_balance', name: 'S', description: '', icon: '', effects: [{ emotion: 'sadness', mode: 'balance' }], chronotype: ['morning'], instruction: '' },
    ];
    const ids = candidateShortlist({ vector: crescent, hour: 8, feedback: [], dominant: 'fear', oilDb: oils }).map((o) => o.id);
    expect(ids[0]).toBe('fear_balance');
  });

  it('eveningHarder → успокаивающие масла получают приоритет', () => {
    const oils: OilEntry[] = [
      { id: 'calm_x', name: 'C', description: '', icon: '', effects: [{ emotion: 'trust', mode: 'calm' }, { emotion: 'fear', mode: 'calm' }], chronotype: ['evening'], instruction: '' },
      { id: 'awaken_x', name: 'A', description: '', icon: '', effects: [{ emotion: 'joy', mode: 'awaken' }], chronotype: ['evening'], instruction: '' },
    ];
    const without = candidateShortlist({ vector: star, hour: 20, feedback: [], oilDb: oils }).map((o) => o.id);
    const withBias = candidateShortlist({ vector: star, hour: 20, feedback: [], oilDb: oils, eveningHarder: true }).map((o) => o.id);
    expect(without[0]).toBe('awaken_x');
    expect(withBias[0]).toBe('calm_x');
  });
});
