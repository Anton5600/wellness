import { describe, it, expect } from 'vitest';
import { EntryContext } from './entry';
import { determineEntryScenario, getGreeting } from './entry';

const base = (overrides: Partial<EntryContext> = {}): EntryContext => ({
  timeOfDay: 'morning',
  streak: { current: 3, longest: 3, lastActiveDate: '2026-09-01' },
  missed: 0,
  yesterday: {
    completed: true,
    eveningFeedbackDone: true,
    practiceInterrupted: false,
    practiceProgress: 0,
    hadCriticalPulse: false,
    color: '#98c281',
    oil: 'Лаванда',
    practiceId: 'bodyScan',
  },
  today: { isUnlockDay: false },
  ...overrides,
});

describe('determineEntryScenario', () => {
  it('чистый день → fresh_day', () => {
    expect(determineEntryScenario(base()).scenario).toBe('fresh_day');
  });

  it('вчера завершено, фидбек не отмечен → pending_feedback', () => {
    const ctx = base({ yesterday: { ...base().yesterday, eveningFeedbackDone: false } });
    expect(determineEntryScenario(ctx).scenario).toBe('pending_feedback');
  });

  it('прерванная практика > 0.5 → unfinished_practice', () => {
    const ctx = base({
      yesterday: {
        ...base().yesterday,
        practiceInterrupted: true,
        practiceProgress: 0.7,
        eveningFeedbackDone: false,
      },
    });
    expect(determineEntryScenario(ctx).scenario).toBe('unfinished_practice');
  });

  it('прерванная практика <= 0.5 не даёт unfinished_practice', () => {
    const ctx = base({
      yesterday: {
        ...base().yesterday,
        practiceInterrupted: true,
        practiceProgress: 0.4,
      },
    });
    expect(determineEntryScenario(ctx).scenario).toBe('fresh_day');
  });

  it('пропущенный день (missed>0, вчера нет ритуала) → missed_day', () => {
    const ctx = base({
      missed: 1,
      yesterday: { ...base().yesterday, completed: false },
    });
    expect(determineEntryScenario(ctx).scenario).toBe('missed_day');
  });

  it('вчерашний критический пульс → warmBackground', () => {
    const ctx = base({
      yesterday: { ...base().yesterday, hadCriticalPulse: true },
    });
    expect(determineEntryScenario(ctx).warmBackground).toBe(true);
  });

  it('warmBackground не зависит от сценария', () => {
    const ctx = base({
      missed: 1,
      yesterday: { ...base().yesterday, completed: false, hadCriticalPulse: true },
    });
    expect(determineEntryScenario(ctx)).toEqual({ scenario: 'missed_day', warmBackground: true });
  });
});

describe('getGreeting', () => {
  it('время суток отражается в приветствии', () => {
    expect(getGreeting('morning', { current: 3, longest: 3, lastActiveDate: '' }, true))
      .toContain('Доброе утро');
    expect(getGreeting('evening', { current: 3, longest: 3, lastActiveDate: '' }, true))
      .toContain('Добрый вечер');
  });

  it('первый день — без «с возвращением»', () => {
    expect(getGreeting('morning', { current: 1, longest: 1, lastActiveDate: '' }, false))
      .toBe('Доброе утро');
  });

  it('пропуск вчерашнего ритуала → «с возвращением»', () => {
    expect(getGreeting('day', { current: 5, longest: 5, lastActiveDate: '' }, false))
      .toContain('с возвращением');
  });
});
