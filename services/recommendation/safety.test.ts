import { describe, it, expect } from 'vitest';
import { detectCrisis, CrisisDetectedError } from './safety';

describe('detectCrisis', () => {
  it('детектирует явные кризисные высказывания', () => {
    expect(detectCrisis('хочу исчезнуть')).toBe(true);
    expect(detectCrisis('нет сил жить')).toBe(true);
    expect(detectCrisis('убить себя')).toBe(true);
    expect(detectCrisis('не вижу смысла жить')).toBe(true);
    expect(detectCrisis('покончить с собой')).toBe(true);
  });

  it('не реагирует на регистр', () => {
    expect(detectCrisis('ХОЧУ ИСЧЕЗНУТЬ')).toBe(true);
    expect(detectCrisis('Суицид')).toBe(true);
  });

  it('не флагает обычный дистресс', () => {
    expect(detectCrisis('устал')).toBe(false);
    expect(detectCrisis('тревога перед встречей')).toBe(false);
    expect(detectCrisis('всё бесит')).toBe(false);
    expect(detectCrisis('')).toBe(false);
  });

  it('не путает «жить» в обычном контексте', () => {
    expect(detectCrisis('хочу жить и радоваться')).toBe(false);
    expect(detectCrisis('учиться жить по-новому')).toBe(false);
  });
});

describe('CrisisDetectedError', () => {
  it('является Error со стабильным именем', () => {
    const e = new CrisisDetectedError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('CrisisDetectedError');
  });
});
