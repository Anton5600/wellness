import { describe, it, expect } from 'vitest';
import { EmotionHistoryEntry } from '../types';
import {
  resolveGoal,
  checkIsStuck,
  EMOTION_PHRASE,
  serverResultToAromaRecommendation,
} from './aromaRecommendationService';

const entry = (emotionKey: EmotionHistoryEntry['emotionKey']): EmotionHistoryEntry => ({
  id: `id_${emotionKey}`,
  userId: 'u',
  timestamp: Date.now(),
  emotionKey,
});

describe('resolveGoal', () => {
  it('явная цель побеждает всё остальное', () => {
    expect(resolveGoal([entry('fear')], 'morning', 20)).toBe('morning');
  });

  it('stuck → stuck_support', () => {
    expect(resolveGoal([entry('fear'), entry('sadness'), entry('anger')], undefined, 10)).toBe('stuck_support');
  });

  it('границы часа суток', () => {
    expect(resolveGoal([], undefined, 5)).toBe('morning');
    expect(resolveGoal([], undefined, 11)).toBe('morning');
    expect(resolveGoal([], undefined, 12)).toBe('focus');
    expect(resolveGoal([], undefined, 16)).toBe('focus');
    expect(resolveGoal([], undefined, 17)).toBe('antistress');
    expect(resolveGoal([], undefined, 21)).toBe('antistress');
    expect(resolveGoal([], undefined, 22)).toBe('evening');
    expect(resolveGoal([], undefined, 4)).toBe('evening');
  });
});

describe('checkIsStuck', () => {
  it('меньше двух записей → не stuck', () => {
    expect(checkIsStuck([])).toBe(false);
    expect(checkIsStuck([entry('fear')])).toBe(false);
  });

  it('две тяжёлые эмоции из трёх последних → stuck', () => {
    expect(checkIsStuck([entry('fear'), entry('sadness'), entry('joy')])).toBe(true);
  });

  it('радость и доверие → не stuck', () => {
    expect(checkIsStuck([entry('joy'), entry('trust'), entry('joy')])).toBe(false);
  });
});

describe('EMOTION_PHRASE', () => {
  it('покрывает все 8 эмоций', () => {
    const keys = Object.keys(EMOTION_PHRASE).sort();
    expect(keys).toEqual(['anger', 'anticipation', 'disgust', 'fear', 'joy', 'sadness', 'surprise', 'trust']);
  });
});

describe('serverResultToAromaRecommendation', () => {
  it('мапит aromaId в имя/иконку/инструкцию из базы', () => {
    const rec = serverResultToAromaRecommendation(
      { aromaId: 'ylang_ylang', aromaReason: 'Снимает напряжение', dominant: 'fear' },
      'evening',
      false
    );
    expect(rec.oilId).toBe('ylang_ylang');
    expect(rec.oilName).toBe('Иланг-иланг');
    expect(rec.reason).toBe('Снимает напряжение');
    expect(rec.emotionSource).toBe('fear');
    expect(rec.title).toBe('Вечерний Покой');
  });

  it('без aromaId → фолбэк на имя из ответа', () => {
    const rec = serverResultToAromaRecommendation(
      { aroma: 'Лаванда', aromaReason: 'расслабляет' },
      'morning',
      false
    );
    expect(rec.oilId).toBe('lavender');
    expect(rec.oilName).toBe('Лаванда');
  });

  it('пустой результат → разумные дефолты', () => {
    const rec = serverResultToAromaRecommendation({}, 'focus', true);
    expect(rec.oilId).toBe('lavender');
    expect(rec.oilName).toBe('Лаванда');
    expect(rec.isStuckAlert).toBe(true);
  });
});
