import { beforeEach, describe, it, expect } from 'vitest';
import { installMemoryStorage } from '../test/localStorage';
import {
  getPatternMemory,
  applyPattern,
  dismissPattern,
  markPatternSeen,
  hasEveningHarderBias,
  AppliedPattern,
} from './patternMemory';

const uid = 'test-user';

const pattern = (id: string, direction: AppliedPattern['direction']): AppliedPattern => ({
  id,
  emotion: 'fear',
  direction,
  appliedAt: '2026-09-01',
});

beforeEach(() => {
  installMemoryStorage();
});

describe('patternMemory — пустая память', () => {
  it('свежая память пустая', () => {
    expect(getPatternMemory(uid)).toEqual({ applied: [], dismissed: [], seen: [] });
  });

  it('битые данные → фолбэк на пустую память', () => {
    localStorage.setItem('pattern_memory_' + uid, 'not-json');
    expect(getPatternMemory(uid)).toEqual({ applied: [], dismissed: [], seen: [] });
  });
});

describe('patternMemory — идемпотентность', () => {
  it('applyPattern не дублирует по id', () => {
    applyPattern(uid, pattern('p1', 'evening_harder'));
    applyPattern(uid, pattern('p1', 'evening_harder'));
    expect(getPatternMemory(uid).applied).toHaveLength(1);
  });

  it('dismissPattern не дублирует', () => {
    dismissPattern(uid, 'p1');
    dismissPattern(uid, 'p1');
    expect(getPatternMemory(uid).dismissed).toEqual(['p1']);
  });

  it('markPatternSeen не дублирует', () => {
    markPatternSeen(uid, 'p1');
    markPatternSeen(uid, 'p1');
    expect(getPatternMemory(uid).seen).toEqual(['p1']);
  });
});

describe('patternMemory — смещение рекомендации', () => {
  it('hasEveningHarderBias true только при применённом вечернем паттерне', () => {
    expect(hasEveningHarderBias(uid)).toBe(false);
    applyPattern(uid, pattern('p1', 'morning_harder'));
    expect(hasEveningHarderBias(uid)).toBe(false);
    applyPattern(uid, pattern('p2', 'evening_harder'));
    expect(hasEveningHarderBias(uid)).toBe(true);
  });
});
