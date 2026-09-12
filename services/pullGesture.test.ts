import { describe, it, expect } from 'vitest';
import {
  shouldEngagePull,
  pullOffsetFor,
  isRefreshTriggered,
  pullLabel,
  REFRESH_THRESHOLD,
  MAX_PULL,
  PULL_RESISTANCE,
} from './pullGesture';

describe('shouldEngagePull', () => {
  it('включается при движении вниз от начала списка', () => {
    expect(shouldEngagePull(0, 40, true)).toBe(true);
  });

  it('не включается, если список не в начале — это обычная прокрутка', () => {
    expect(shouldEngagePull(0, 40, false)).toBe(false);
  });

  it('не включается при движении вверх', () => {
    expect(shouldEngagePull(0, -40, true)).toBe(false);
  });

  it('игнорирует мелкий сдвиг — иначе жест срабатывал бы на тапе', () => {
    expect(shouldEngagePull(0, 4, true)).toBe(false);
  });

  it('не включается на горизонтальном свайпе', () => {
    expect(shouldEngagePull(60, 40, true)).toBe(false);
  });
});

describe('pullOffsetFor', () => {
  it('тянется с сопротивлением, а не один в один за пальцем', () => {
    expect(pullOffsetFor(100)).toBe(100 * PULL_RESISTANCE);
  });

  it('не уходит выше максимума', () => {
    expect(pullOffsetFor(10_000)).toBe(MAX_PULL);
  });

  it('не уходит в минус при движении вверх', () => {
    expect(pullOffsetFor(-50)).toBe(0);
  });
});

describe('isRefreshTriggered', () => {
  it('срабатывает на пороге и выше', () => {
    expect(isRefreshTriggered(REFRESH_THRESHOLD)).toBe(true);
    expect(isRefreshTriggered(REFRESH_THRESHOLD + 1)).toBe(true);
  });

  it('не срабатывает ниже порога', () => {
    expect(isRefreshTriggered(REFRESH_THRESHOLD - 1)).toBe(false);
  });
});

describe('pullLabel', () => {
  it('во время обновления', () => {
    expect(pullLabel(0, true)).toBe('Обновляем…');
  });

  it('при достаточной протяжке предлагает отпустить', () => {
    expect(pullLabel(REFRESH_THRESHOLD, false)).toBe('Отпустите');
  });

  it('в начале жеста подсказывает направление', () => {
    expect(pullLabel(10, false)).toBe('Потяните вниз');
  });
});
