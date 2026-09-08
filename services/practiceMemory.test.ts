import { beforeEach, describe, it, expect } from 'vitest';
import { installMemoryStorage } from '../test/localStorage';
import {
  recordPracticeFeedback,
  getPracticeFeedbackEntries,
  recordPracticeSession,
  getPartialSessionFor,
  saveWritingDraft,
  readWritingDraft,
  clearWritingDraft,
  getPracticeUpdateCount,
  incrementPracticeUpdate,
} from './practiceMemory';
import { PracticeFeedbackEntry, PracticeSessionRecord } from '../types';

const uid = 'test-user';

const feedback = (timestamp: number): PracticeFeedbackEntry => ({
  practiceId: 'bodyScan',
  dominant: 'sadness',
  arousal: 'low',
  feedback: 'not_helped',
  timestamp,
});

const session = (startedAt: number, completed: boolean): PracticeSessionRecord => ({
  practiceId: 'bodyScan',
  dominant: 'sadness',
  arousal: 'low',
  completed,
  progress: completed ? 180 : 60,
  startedAt,
});

beforeEach(() => {
  installMemoryStorage();
});

describe('practiceMemory — отзывы', () => {
  it('запись и чтение по убыванию времени', () => {
    recordPracticeFeedback(uid, feedback(1000));
    recordPracticeFeedback(uid, feedback(3000));
    recordPracticeFeedback(uid, feedback(2000));

    const entries = getPracticeFeedbackEntries(uid);
    expect(entries.map((e) => e.timestamp)).toEqual([3000, 2000, 1000]);
  });

  it('кап 100 записей: самые старые отбрасываются', () => {
    for (let i = 0; i < 105; i++) {
      recordPracticeFeedback(uid, feedback(i * 1000));
    }
    const entries = getPracticeFeedbackEntries(uid);
    expect(entries.length).toBe(100);
    // Старшие 5 (0..4) выпали — минимум теперь 5000.
    expect(entries[entries.length - 1].timestamp).toBe(5000);
    expect(entries[0].timestamp).toBe(104000);
  });

  it('пустая память → пустой массив', () => {
    expect(getPracticeFeedbackEntries(uid)).toEqual([]);
  });

  it('битые данные в localStorage → фолбэк на пустой массив', () => {
    localStorage.setItem('practice_memory_' + uid, '{"feedback": 42}');
    expect(getPracticeFeedbackEntries(uid)).toEqual([]);
  });
});

describe('practiceMemory — сессии', () => {
  it('находит прерванную сессию по дате', () => {
    const ts = Date.parse('2026-09-01T10:00:00Z');
    recordPracticeSession(uid, session(ts, false));
    expect(getPartialSessionFor(uid, '2026-09-01')?.startedAt).toBe(ts);
  });

  it('не путает завершённую сессию с прерванной', () => {
    const ts = Date.parse('2026-09-01T10:00:00Z');
    recordPracticeSession(uid, session(ts, true));
    expect(getPartialSessionFor(uid, '2026-09-01')).toBeNull();
  });

  it('не находит сессию по чужой дате', () => {
    const ts = Date.parse('2026-09-01T10:00:00Z');
    recordPracticeSession(uid, session(ts, false));
    expect(getPartialSessionFor(uid, '2026-09-02')).toBeNull();
  });
});

describe('practiceMemory — черновик письма', () => {
  it('круговорот save → read → clear', () => {
    saveWritingDraft(uid, 'черновик');
    expect(readWritingDraft(uid)).toBe('черновик');
    clearWritingDraft(uid);
    expect(readWritingDraft(uid)).toBe('');
  });
});

describe('practiceMemory — лимит переигровки', () => {
  it('счётчик растёт и изолирован по дате', () => {
    expect(getPracticeUpdateCount(uid, '2026-09-01')).toBe(0);
    expect(incrementPracticeUpdate(uid, '2026-09-01')).toBe(1);
    expect(incrementPracticeUpdate(uid, '2026-09-01')).toBe(2);
    // Другая дата не затронута.
    expect(getPracticeUpdateCount(uid, '2026-09-02')).toBe(0);
  });
});
