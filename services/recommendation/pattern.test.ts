import { describe, it, expect } from 'vitest';
import { EmotionKey, PlutchikVector, EmotionalGraphEntry } from '../../types';
import { detectTimeOfDayPattern, flattenEmotionSamples, EmotionSample } from './pattern';

// Локальное время: детекция классифицирует по `new Date(ts).getHours()`, поэтому
// таймстамп строим через локальный конструктор, а не UTC — тест не зависит от TZ.
const at = (hour: number, day = 1): number => new Date(2026, 8, day, hour, 0, 0, 0).getTime();

const vec = (overrides: Partial<PlutchikVector>): PlutchikVector => ({
  joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0,
  ...overrides,
});

const s = (hour: number, dominant: EmotionKey, vector?: PlutchikVector): EmotionSample => ({
  timestamp: at(hour),
  dominant,
  vector,
});

describe('detectTimeOfDayPattern', () => {
  it('возвращает null при нехватке сэмплов в одной из половин суток', () => {
    expect(detectTimeOfDayPattern([s(8, 'joy'), s(9, 'trust')])).toBeNull();
    expect(detectTimeOfDayPattern([s(8, 'joy'), s(20, 'fear')])).toBeNull(); // 1 утро + 1 вечер
  });

  it('находит «вечером тяжелее» с нарастанием страха', () => {
    const samples = [
      s(8, 'joy', vec({ joy: 0.8 })),
      s(9, 'trust', vec({ trust: 0.7 })),
      s(20, 'fear', vec({ fear: 0.9 })),
      s(21, 'fear', vec({ fear: 0.8, sadness: 0.3 })),
    ];
    const p = detectTimeOfDayPattern(samples);
    expect(p).not.toBeNull();
    expect(p!.direction).toBe('evening_harder');
    expect(p!.emotion).toBe('fear');
    expect(p!.id).toBe('tod:evening_harder:fear');
    expect(p!.practiceId).toBe('vibroPacing');
    expect(p!.reminder).toEqual({ hour: 17, minute: 30 });
    expect(p!.statement).toContain('вечеру');
    expect(p!.suggestion).toContain('17:30');
  });

  it('находит «утром тяжелее»', () => {
    const samples = [
      s(8, 'sadness', vec({ sadness: 0.85 })),
      s(10, 'sadness', vec({ sadness: 0.7 })),
      s(20, 'joy', vec({ joy: 0.6 })),
      s(22, 'trust', vec({ trust: 0.8 })),
    ];
    const p = detectTimeOfDayPattern(samples);
    expect(p!.direction).toBe('morning_harder');
    expect(p!.emotion).toBe('sadness');
    expect(p!.practiceId).toBe('bodyScan');
    expect(p!.reminder).toEqual({ hour: 8, minute: 0 });
    expect(p!.suggestion).toContain('утра');
  });

  it('возвращает null, когда разница ниже порога', () => {
    const samples = [
      s(8, 'joy', vec({ joy: 0.7 })),
      s(9, 'trust', vec({ trust: 0.7 })),
      s(20, 'joy', vec({ joy: 0.6 })),
      s(21, 'trust', vec({ trust: 0.6 })),
    ];
    expect(detectTimeOfDayPattern(samples)).toBeNull();
  });

  it('использует доминанту, когда вектор отсутствует', () => {
    const samples = [s(8, 'joy'), s(9, 'trust'), s(20, 'anger'), s(21, 'anger')];
    const p = detectTimeOfDayPattern(samples);
    expect(p!.direction).toBe('evening_harder');
    expect(p!.emotion).toBe('anger');
  });
});

describe('flattenEmotionSamples', () => {
  it('раскладывает записи и их пульсы в плоский список', () => {
    const entry: EmotionalGraphEntry = {
      date: '2026-09-01',
      timestamp: at(8),
      microInput: 'x',
      inputType: 'tap',
      plutchikInferred: vec({ joy: 0.8 }),
      dominant: 'joy',
      aroma: 'Лаванда',
      aromaReason: 'r',
      insight: 'i',
      breathingDone: false,
      breathingPattern: '4-4-6',
      stuckFlag: false,
      pulses: [
        { timestamp: at(20), microInput: 'p', inputType: 'tap', vector: vec({ fear: 0.7 }), dominant: 'fear', scenario: 'shift', criticalShift: true },
      ],
    };
    const flat = flattenEmotionSamples([entry]);
    expect(flat).toHaveLength(2);
    expect(flat[0].dominant).toBe('joy');
    expect(flat[1].dominant).toBe('fear');
  });

  it('игнорирует пустой список пульсов', () => {
    const entry: EmotionalGraphEntry = {
      date: '2026-09-01', timestamp: at(8), microInput: 'x', inputType: 'tap',
      plutchikInferred: vec({ joy: 0.8 }), dominant: 'joy', aroma: 'Лаванда',
      aromaReason: 'r', insight: 'i', breathingDone: false, breathingPattern: '4-4-6', stuckFlag: false,
    };
    expect(flattenEmotionSamples([entry])).toHaveLength(1);
  });
});
