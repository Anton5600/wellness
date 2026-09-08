import { describe, it, expect } from 'vitest';
import { isValidHexColor, colorForDominant, colorForDyad, EMOTION_HEX } from './color';

describe('isValidHexColor', () => {
  it('принимает #rrggbb и #rgb', () => {
    expect(isValidHexColor('#f59e0b')).toBe(true);
    expect(isValidHexColor('#F59E0B')).toBe(true);
    expect(isValidHexColor('#fff')).toBe(true);
  });

  it('отклоняет невалидные значения', () => {
    expect(isValidHexColor('f59e0b')).toBe(false);
    expect(isValidHexColor('#f59e0')).toBe(false);
    expect(isValidHexColor('#gggggg')).toBe(false);
    expect(isValidHexColor('')).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
    expect(isValidHexColor(42)).toBe(false);
  });
});

describe('colorForDominant', () => {
  it('возвращает hex для каждой эмоции', () => {
    for (const [emotion, hex] of Object.entries(EMOTION_HEX)) {
      expect(colorForDominant(emotion as keyof typeof EMOTION_HEX)).toBe(hex);
      expect(isValidHexColor(colorForDominant(emotion as keyof typeof EMOTION_HEX))).toBe(true);
    }
  });
});

describe('colorForDyad', () => {
  it('возвращает валидный hex для диады', () => {
    const color = colorForDyad({ key: 'love', label: 'Любовь', emotions: ['joy', 'trust'] });
    expect(isValidHexColor(color)).toBe(true);
  });

  it('средний цвет совпадает с midpoint RGB', () => {
    // joy #f59e0b, trust #10b981 → округлённое среднее по каналам (#83ac46).
    expect(colorForDyad({ key: 'love', label: 'Любовь', emotions: ['joy', 'trust'] })).toBe('#83ac46');
  });
});
