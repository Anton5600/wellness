import { describe, it, expect } from 'vitest';
import { breathingPatternFor, parseBreathPattern, PATTERN_DEFAULT, PATTERN_STUCK } from './breathing';

describe('breathingPatternFor', () => {
  it('stuck-режим → укороченный паттерн 4-4-4', () => {
    expect(breathingPatternFor(true)).toBe('4-4-4');
    expect(breathingPatternFor(true)).toBe(PATTERN_STUCK);
  });

  it('обычный режим → паттерн 4-4-6', () => {
    expect(breathingPatternFor(false)).toBe('4-4-6');
    expect(breathingPatternFor(false)).toBe(PATTERN_DEFAULT);
  });
});

describe('parseBreathPattern', () => {
  it('валидные паттерны → кортеж секунд', () => {
    expect(parseBreathPattern('4-4-6')).toEqual([4, 4, 6]);
    expect(parseBreathPattern('4-4-4')).toEqual([4, 4, 4]);
  });

  it('невалидные/пустые/undefined → фолбэк 4-4-6', () => {
    expect(parseBreathPattern('foo')).toEqual([4, 4, 6]);
    expect(parseBreathPattern('')).toEqual([4, 4, 6]);
    expect(parseBreathPattern(undefined)).toEqual([4, 4, 6]);
  });
});
