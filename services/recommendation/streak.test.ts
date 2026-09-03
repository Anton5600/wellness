import { describe, it, expect } from 'vitest';
import { StreakInfo } from '../../types';
import { daysBetween, computeStreakTransition, missedDays } from './streak';

const streak = (current: number, longest: number, lastActiveDate: string): StreakInfo => ({
  current,
  longest,
  lastActiveDate,
});

describe('daysBetween', () => {
  it('считает разницу в днях между UTC-строками', () => {
    expect(daysBetween('2026-09-01', '2026-09-01')).toBe(0);
    expect(daysBetween('2026-09-01', '2026-09-02')).toBe(1);
    expect(daysBetween('2026-09-01', '2026-09-04')).toBe(3);
    expect(daysBetween('2026-09-03', '2026-09-01')).toBe(-2);
  });

  it('невалидные строки дают 0', () => {
    expect(daysBetween('nope', '2026-09-02')).toBe(0);
  });
});

describe('computeStreakTransition', () => {
  it('gap 0 (уже сегодня активны) — без изменений', () => {
    const prev = streak(5, 7, '2026-09-02');
    expect(computeStreakTransition(prev, '2026-09-02')).toEqual(prev);
  });

  it('gap 1 (вчера) — current += 1', () => {
    const out = computeStreakTransition(streak(5, 5, '2026-09-01'), '2026-09-02');
    expect(out).toEqual({ current: 6, longest: 6, lastActiveDate: '2026-09-02' });
  });

  it('gap 2 (пропущен 1 день, грейс) — current += 1, не сброс', () => {
    const out = computeStreakTransition(streak(5, 5, '2026-08-31'), '2026-09-02');
    expect(out.current).toBe(6);
    expect(out.longest).toBe(6);
  });

  it('gap >= 3 (пропущено 2+ дня) — сброс к 1', () => {
    const out = computeStreakTransition(streak(5, 9, '2026-08-30'), '2026-09-02');
    expect(out.current).toBe(1);
    expect(out.longest).toBe(9); // longest не отбирается
    expect(out.lastActiveDate).toBe('2026-09-02');
  });

  it('gap 2 не роняет longest, если он уже выше', () => {
    const out = computeStreakTransition(streak(3, 12, '2026-08-31'), '2026-09-02');
    expect(out.current).toBe(4);
    expect(out.longest).toBe(12);
  });
});

describe('missedDays', () => {
  it('0/1/2 по gap', () => {
    expect(missedDays(streak(1, 1, '2026-09-02'), '2026-09-02')).toBe(0);
    expect(missedDays(streak(1, 1, '2026-09-01'), '2026-09-02')).toBe(1);
    expect(missedDays(streak(1, 1, '2026-08-31'), '2026-09-02')).toBe(2);
    expect(missedDays(streak(1, 1, '2026-08-01'), '2026-09-02')).toBe(2);
  });
});
