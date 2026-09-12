import { describe, it, expect } from 'vitest';
import { PlutchikVector, OilEntry, MixedEmotion } from '../../types';
import { OIL_DATABASE } from '../../data/oilDatabase';
import { DYADS } from './dyads';
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

  it('диада → шорт-лист только из масел с прямой привязкой dyads', () => {
    const dyad: MixedEmotion = { key: 'love', label: 'Любовь', emotions: ['joy', 'trust'] };
    const oils: OilEntry[] = [
      { id: 'tagged', name: 'T', description: '', icon: '', effects: [{ emotion: 'joy', mode: 'awaken' }], dyads: ['love'], chronotype: ['morning'], instruction: '' },
      { id: 'untagged', name: 'U', description: '', icon: '', effects: [{ emotion: 'joy', mode: 'awaken' }, { emotion: 'trust', mode: 'calm' }], chronotype: ['morning'], instruction: '' },
    ];
    const ids = candidateShortlist({ vector: star, hour: 8, feedback: [], dominant: 'joy', dyad, oilDb: oils }).map((o) => o.id);
    expect(ids).toEqual(['tagged']);
  });

  it('диада: масло вне текущего хронотипа всё равно попадает (не роняем подбор)', () => {
    const dyad: MixedEmotion = { key: 'alarm', label: 'Испуг', emotions: ['fear', 'surprise'] };
    const oils: OilEntry[] = [
      { id: 'evening_only', name: 'E', description: '', icon: '', effects: [{ emotion: 'fear', mode: 'calm' }], dyads: ['alarm'], chronotype: ['evening'], instruction: '' },
    ];
    const ids = candidateShortlist({ vector: star, hour: 8, feedback: [], dyad, oilDb: oils }).map((o) => o.id);
    expect(ids).toEqual(['evening_only']);
  });

  it('диада: забаненное масло исключается', () => {
    const dyad: MixedEmotion = { key: 'love', label: 'Любовь', emotions: ['joy', 'trust'] };
    const oils: OilEntry[] = [
      { id: 'rose', name: 'R', description: '', icon: '', effects: [{ emotion: 'joy', mode: 'support' }], dyads: ['love'], chronotype: ['day'], instruction: '' },
      { id: 'neroli', name: 'N', description: '', icon: '', effects: [{ emotion: 'trust', mode: 'support' }], dyads: ['love'], chronotype: ['day'], instruction: '' },
    ];
    const ids = candidateShortlist({
      vector: star,
      hour: 12,
      feedback: [{ oilId: 'rose', feedback: 'worse', timestamp: Date.now() - 1000 }],
      dyad,
      oilDb: oils,
    }).map((o) => o.id);
    expect(ids).toEqual(['neroli']);
  });

  it('диада: масло под текущее время суток ранжируется выше, но остальные не роняются', () => {
    const dyad: MixedEmotion = { key: 'love', label: 'Любовь', emotions: ['joy', 'trust'] };
    const oils: OilEntry[] = [
      { id: 'evening', name: 'E', description: '', icon: '', effects: [{ emotion: 'trust', mode: 'calm' }], dyads: ['love'], chronotype: ['evening'], instruction: '' },
      { id: 'day', name: 'D', description: '', icon: '', effects: [{ emotion: 'joy', mode: 'support' }], dyads: ['love'], chronotype: ['day'], instruction: '' },
    ];
    const ids = candidateShortlist({ vector: star, hour: 12, feedback: [], dyad, oilDb: oils }).map((o) => o.id);
    expect(ids[0]).toBe('day');
    expect(ids).toContain('evening');
  });

  it('диада: масла с одной диадой ранжируются выше «универсальных»', () => {
    const dyad: MixedEmotion = { key: 'love', label: 'Любовь', emotions: ['joy', 'trust'] };
    const oils: OilEntry[] = [
      { id: 'multi', name: 'M', description: '', icon: '', effects: [{ emotion: 'joy', mode: 'support' }], dyads: ['love', 'remorse', 'contempt'], chronotype: ['day'], instruction: '' },
      { id: 'single', name: 'S', description: '', icon: '', effects: [{ emotion: 'trust', mode: 'support' }], dyads: ['love'], chronotype: ['day'], instruction: '' },
    ];
    const ids = candidateShortlist({ vector: star, hour: 12, feedback: [], dyad, oilDb: oils }).map((o) => o.id);
    expect(ids[0]).toBe('single');
  });

  it('реальная база: каждая из 8 диад даёт непустой шорт-лист', () => {
    for (const dyad of DYADS) {
      const result = candidateShortlist({ vector: circle, hour: 12, feedback: [], dyad, oilDb: OIL_DATABASE });
      expect(result.length, `диада «${dyad.label}» дала пустой шорт-лист`).toBeGreaterThan(0);
    }
  });
});

/**
 * Жёсткая привязка «эмоция → масло» (пункт C) и порядок ранжирования (пункт B).
 * Регрессия к случаю «доминанта Радость, а рекомендуется Бергамот»: при одиночной
 * эмоции первым обязан идти главный масло эмоции из источников.
 */
describe('привязка «эмоция → масло»', () => {
  const singleDominant = vec({ joy: 0.9, trust: 0.15, fear: 0.15, surprise: 0.15, sadness: 0.15, disgust: 0.2, anger: 0.15, anticipation: 0.15 });

  it('для доминанты «Радость» первым идёт Дикий апельсин, вторым — Мята перечная', () => {
    const ids = candidateShortlist({ vector: singleDominant, hour: 13, feedback: [], dominant: 'joy', oilDb: OIL_DATABASE }).map((o) => o.id);
    expect(ids[0]).toBe('wild_orange');
    expect(ids[1]).toBe('peppermint');
  });

  it('привязанное масло не выпадает из шорт-листа из-за времени суток', () => {
    // Дикий апельсин размечен как morning/day, но в 21:00 он обязан остаться первым.
    const ids = candidateShortlist({ vector: singleDominant, hour: 21, feedback: [], dominant: 'joy', oilDb: OIL_DATABASE }).map((o) => o.id);
    expect(ids[0]).toBe('wild_orange');
  });

  it('забаненное главное масло уступает место следующему из привязки', () => {
    const feedback = [{ oilId: 'wild_orange', feedback: 'worse' as const, timestamp: Date.now() - 1000 }];
    const ids = candidateShortlist({ vector: singleDominant, hour: 13, feedback, dominant: 'joy', oilDb: OIL_DATABASE }).map((o) => o.id);
    expect(ids).not.toContain('wild_orange');
    expect(ids[0]).toBe('peppermint');
  });

  it('покрытие целевой эмоции важнее числа совпадений по режиму (пункт B)', () => {
    const oils: OilEntry[] = [
      // Два совпадения по режиму, но эмоция не та.
      { id: 'two_matches', name: 'T', description: '', icon: '', effects: [{ emotion: 'sadness', mode: 'balance' }, { emotion: 'disgust', mode: 'balance' }], chronotype: ['morning', 'day'], instruction: '' },
      // Одно совпадение, зато работает именно с доминантой.
      { id: 'covers_joy', name: 'C', description: '', icon: '', effects: [{ emotion: 'joy', mode: 'balance' }], chronotype: ['morning', 'day'], instruction: '' },
      // Диады нет, привязка joy указывает на реальные id — их в фикстуре нет, поэтому работает общий ранг.
    ];
    const ids = candidateShortlist({ vector: singleDominant, hour: 13, feedback: [], dominant: 'joy', oilDb: oils }).map((o) => o.id);
    expect(ids[0]).toBe('covers_joy');
  });
});
