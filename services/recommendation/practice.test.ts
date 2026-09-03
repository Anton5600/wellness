import { describe, it, expect } from 'vitest';
import { inferArousal, selectPractice, bannedPracticeIds } from './practice';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-08-31T12:00:00Z');

describe('inferArousal', () => {
  it('по классу эмоции: высоковозбуждённые → high', () => {
    expect(inferArousal('anger')).toBe('high');
    expect(inferArousal('fear')).toBe('high');
    expect(inferArousal('joy')).toBe('high');
    expect(inferArousal('surprise')).toBe('high');
  });

  it('по классу эмоции: низковозбуждённые → low', () => {
    expect(inferArousal('sadness')).toBe('low');
    expect(inferArousal('trust')).toBe('low');
    expect(inferArousal('disgust')).toBe('low');
    expect(inferArousal('anticipation')).toBe('low');
  });

  it('интенсивность переопределяет класс', () => {
    expect(inferArousal('anger', 0.4)).toBe('low');
    expect(inferArousal('anger', 0.8)).toBe('high');
    expect(inferArousal('sadness', 0.8)).toBe('high');
  });
});

describe('selectPractice', () => {
  it('спот-чеки матрицы', () => {
    expect(selectPractice('anger', 'high')).toBe('pmr');
    expect(selectPractice('anger', 'low')).toBe('mantraLoop');
    expect(selectPractice('fear', 'high')).toBe('grounding54321');
    expect(selectPractice('fear', 'low')).toBe('vibroPacing');
    expect(selectPractice('sadness', 'low')).toBe('bodyScan');
    expect(selectPractice('sadness', 'high')).toBe('thermalImagery');
    expect(selectPractice('disgust', 'low')).toBe('expressiveWriting');
    expect(selectPractice('anticipation', 'high')).toBe('pmr');
    expect(selectPractice('trust', 'high')).toBe('fingerTracing');
    expect(selectPractice('joy', 'low')).toBe('fingerTracing');
    expect(selectPractice('surprise', 'high')).toBe('grounding54321');
  });

  it('фолбэк без явного arousal → inferArousal по классу', () => {
    expect(selectPractice('anger')).toBe('pmr');
    expect(selectPractice('sadness')).toBe('bodyScan');
    expect(selectPractice('fear')).toBe('grounding54321');
  });

  it('забаненная практика пропускается → следующая в списке', () => {
    expect(selectPractice('sadness', 'low', new Set(['bodyScan']))).toBe('thermalImagery');
  });

  it('всё в бане → фолбэк на первую из списка', () => {
    expect(selectPractice('sadness', 'low', new Set(['bodyScan', 'thermalImagery']))).toBe('bodyScan');
  });
});

describe('bannedPracticeIds', () => {
  it('пустая история → пустое множество', () => {
    expect(bannedPracticeIds([], now).size).toBe(0);
  });

  it('«не помогло» в окне бана → практика в бане', () => {
    const banned = bannedPracticeIds(
      [{ practiceId: 'bodyScan', feedback: 'not_helped', timestamp: now.getTime() - DAY }],
      now
    );
    expect(banned.has('bodyScan')).toBe(true);
  });

  it('«не помогло» старше banDays → не в бане', () => {
    const banned = bannedPracticeIds(
      [{ practiceId: 'bodyScan', feedback: 'not_helped', timestamp: now.getTime() - 8 * DAY }],
      now
    );
    expect(banned.has('bodyScan')).toBe(false);
  });

  it('«помогло» не банит', () => {
    const banned = bannedPracticeIds(
      [{ practiceId: 'pmr', feedback: 'helped', timestamp: now.getTime() - DAY }],
      now
    );
    expect(banned.size).toBe(0);
  });

  it('граница окна: ровно banDays назад ещё в бане', () => {
    const banned = bannedPracticeIds(
      [{ practiceId: 'pmr', feedback: 'not_helped', timestamp: now.getTime() - 7 * DAY }],
      now
    );
    expect(banned.has('pmr')).toBe(true);
  });
});
