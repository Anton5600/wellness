import { describe, it, expect } from 'vitest';
import { chronotypeForHour } from './chronotype';

describe('chronotypeForHour', () => {
  it('утро: 5–11', () => {
    expect(chronotypeForHour(5)).toBe('morning');
    expect(chronotypeForHour(11)).toBe('morning');
  });

  it('день: 12–17', () => {
    expect(chronotypeForHour(12)).toBe('day');
    expect(chronotypeForHour(17)).toBe('day');
  });

  it('вечер: 18–4 (включая полночь)', () => {
    expect(chronotypeForHour(18)).toBe('evening');
    expect(chronotypeForHour(23)).toBe('evening');
    expect(chronotypeForHour(0)).toBe('evening');
    expect(chronotypeForHour(4)).toBe('evening');
  });
});
