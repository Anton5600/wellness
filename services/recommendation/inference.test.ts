import { describe, it, expect } from 'vitest';
import { inferEmotionState, buildFeedbackEntries, bumpDominant, bumpPair, scoreEmotions, isEmotionKey, DEFAULT_PLUTCHIK } from './inference';

describe('inferEmotionState', () => {
  it('радость по ключевому слову', () => {
    const { dominant, vector } = inferEmotionState('мне сегодня очень радостно', DEFAULT_PLUTCHIK);
    expect(dominant).toBe('joy');
    expect(vector.joy).toBeCloseTo(0.8);
  });

  it('«бодро, хочется действовать» → радость (энергия), а не дефолт', () => {
    const { dominant } = inferEmotionState('бодро и хочется действовать', DEFAULT_PLUTCHIK);
    expect(dominant).toBe('joy');
  });

  it('«действовать/старт» → ожидание', () => {
    expect(inferEmotionState('хочу начать действовать', DEFAULT_PLUTCHIK).dominant).toBe('anticipation');
  });

  it('грусть по эмодзи', () => {
    const { dominant } = inferEmotionState('что-то 😔 на душе', DEFAULT_PLUTCHIK);
    expect(dominant).toBe('sadness');
  });

  it('нет совпадений → anticipation по умолчанию', () => {
    const { dominant } = inferEmotionState('всё как обычно', DEFAULT_PLUTCHIK);
    expect(dominant).toBe('anticipation');
  });

  it('отрицание «не» не ломает классификацию: неспокойно → страх, а не доверие', () => {
    expect(inferEmotionState('мне неспокойно', DEFAULT_PLUTCHIK).dominant).toBe('fear');
    expect(inferEmotionState('неуверен в себе', DEFAULT_PLUTCHIK).dominant).toBe('fear');
    expect(inferEmotionState('я спокойно себя чувствую', DEFAULT_PLUTCHIK).dominant).toBe('trust');
  });

  it('остальные эмоции baseline сохраняются', () => {
    const baseline = { ...DEFAULT_PLUTCHIK, trust: 0.9 };
    const { vector } = inferEmotionState('злюсь', baseline);
    expect(vector.trust).toBe(0.9);
  });

  it('доминанта не превышает 1.0', () => {
    const baseline = { ...DEFAULT_PLUTCHIK, joy: 0.95 };
    const { vector } = inferEmotionState('радость!', baseline);
    expect(vector.joy).toBe(1.0);
  });
});

describe('bumpDominant', () => {
  it('доминанта становится главной осью (не ниже максимума остальных)', () => {
    const baseline = { ...DEFAULT_PLUTCHIK, sadness: 0.9, joy: 0.5 };
    const v = bumpDominant(baseline, 'joy');
    const others = Object.keys(v).filter((k) => k !== 'joy') as (keyof typeof v)[];
    expect(v.joy).toBeGreaterThanOrEqual(Math.max(...others.map((k) => v[k])));
  });

  it('не выходит за 1.0 даже при насыщенном baseline', () => {
    const baseline = { ...DEFAULT_PLUTCHIK, sadness: 1.0 };
    const v = bumpDominant(baseline, 'joy');
    expect(v.joy).toBeLessThanOrEqual(1.0);
    expect(v.joy).toBe(1.0);
  });

  it('остальные оси не меняются', () => {
    const baseline = { ...DEFAULT_PLUTCHIK, trust: 0.9 };
    const v = bumpDominant(baseline, 'anger');
    expect(v.trust).toBe(0.9);
  });
});

describe('bumpPair', () => {
  it('обе оси становятся главными (не ниже максимума остальных)', () => {
    const baseline = { ...DEFAULT_PLUTCHIK, sadness: 0.9 };
    const v = bumpPair(baseline, 'joy', 'trust');
    const others = Object.keys(v).filter((k) => k !== 'joy' && k !== 'trust') as (keyof typeof v)[];
    const maxOther = Math.max(...others.map((k) => v[k]));
    expect(v.joy).toBeGreaterThanOrEqual(maxOther);
    expect(v.trust).toBeGreaterThanOrEqual(maxOther);
  });

  it('не превышает 1.0 при насыщенном baseline', () => {
    const baseline = { ...DEFAULT_PLUTCHIK, joy: 0.95, trust: 0.9 };
    const v = bumpPair(baseline, 'joy', 'trust');
    expect(v.joy).toBeLessThanOrEqual(1.0);
    expect(v.trust).toBeLessThanOrEqual(1.0);
  });

  it('остальные оси не меняются', () => {
    const baseline = { ...DEFAULT_PLUTCHIK, anger: 0.7 };
    const v = bumpPair(baseline, 'joy', 'trust');
    expect(v.anger).toBe(0.7);
  });
});

describe('scoreEmotions', () => {
  it('считает число совпадений по каждой эмоции', () => {
    const scores = scoreEmotions('мне тревожно и боюсь');
    expect(scores.fear).toBeGreaterThanOrEqual(1);
    expect(scores.joy).toBe(0);
  });
});

describe('inferEmotionState — диады', () => {
  it('радость + доверие → Любовь', () => {
    const { dominant, dyad, vector } = inferEmotionState('мне радостно и спокойно', DEFAULT_PLUTCHIK);
    expect(dyad?.key).toBe('love');
    expect(dyad?.label).toBe('Любовь');
    expect(dominant).toBe('joy');
    expect(vector.joy).toBeGreaterThan(vector.fear);
    expect(vector.trust).toBeGreaterThan(vector.fear);
  });

  it('одна эмоция (страх) → диады нет', () => {
    const { dominant, dyad } = inferEmotionState('мне тревожно и боюсь', DEFAULT_PLUTCHIK);
    expect(dyad).toBeUndefined();
    expect(dominant).toBe('fear');
  });

  it('гнев + отвращение → Презрение', () => {
    const { dyad } = inferEmotionState('чувствую отвращение и злость', DEFAULT_PLUTCHIK);
    expect(dyad?.key).toBe('contempt');
  });

  it('несмежные эмоции (радость + страх) → диады нет', () => {
    const { dominant, dyad } = inferEmotionState('радостно, но тревожно', DEFAULT_PLUTCHIK);
    expect(dyad).toBeUndefined();
    expect(dominant).toBe('joy'); // ничья 1:1 → порядок колеса: joy раньше fear
  });
});

describe('isEmotionKey', () => {
  it('валидные эмоции → true, прочее → false', () => {
    expect(isEmotionKey('joy')).toBe(true);
    expect(isEmotionKey('anticipation')).toBe(true);
    expect(isEmotionKey('boredom')).toBe(false);
    expect(isEmotionKey(undefined)).toBe(false);
    expect(isEmotionKey(42)).toBe(false);
  });
});

describe('buildFeedbackEntries', () => {
  it('пустая история → пусто', () => {
    expect(buildFeedbackEntries([])).toEqual([]);
    expect(buildFeedbackEntries(undefined as any)).toEqual([]);
  });

  it('мапит имя масла → id без учёта регистра', () => {
    const entries = buildFeedbackEntries([
      { aroma: 'Иланг-Иланг', eveningFeedback: 'worse', timestamp: 1000 },
    ]);
    expect(entries).toEqual([{ oilId: 'ylang_ylang', feedback: 'worse', timestamp: 1000 }]);
  });

  it('использует aromaId, если он есть', () => {
    const entries = buildFeedbackEntries([
      { aroma: 'любое', aromaId: 'lavender', eveningFeedback: 'better', timestamp: 2000 },
    ]);
    expect(entries).toEqual([{ oilId: 'lavender', feedback: 'better', timestamp: 2000 }]);
  });

  it('пропускает записи без фидбека или timestamp', () => {
    const entries = buildFeedbackEntries([
      { aroma: 'Лаванда', timestamp: 1000 }, // нет фидбека
      { aroma: 'Лаванда', eveningFeedback: 'same' }, // нет timestamp
      null,
    ]);
    expect(entries).toEqual([]);
  });
});
