import { describe, it, expect } from 'vitest';
import { inferEmotionState, buildFeedbackEntries, DEFAULT_PLUTCHIK } from './inference';

describe('inferEmotionState', () => {
  it('радость по ключевому слову', () => {
    const { dominant, vector } = inferEmotionState('мне сегодня очень радостно', DEFAULT_PLUTCHIK);
    expect(dominant).toBe('joy');
    expect(vector.joy).toBeCloseTo(0.7);
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
