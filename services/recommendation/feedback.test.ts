import { describe, it, expect } from 'vitest';
import { eveningFeedbackOptions } from './feedback';

describe('eveningFeedbackOptions', () => {
  it('позитивная доминанта → заякорить (better = «Закрепить», worse = «Сбило»)', () => {
    const opts = eveningFeedbackOptions(true);
    expect(opts.map((o) => [o.value, o.label])).toEqual([
      ['better', 'Закрепить'],
      ['same', 'Без изменений'],
      ['worse', 'Сбило'],
    ]);
  });

  it('негативная доминанта → улучшение (better = «Стало лучше», worse = «Не помогло»)', () => {
    const opts = eveningFeedbackOptions(false);
    expect(opts.map((o) => [o.value, o.label])).toEqual([
      ['better', 'Стало лучше'],
      ['same', 'Без изменений'],
      ['worse', 'Не помогло'],
    ]);
  });

  it('значения не меняются между ветками (бан масла по worse не ломается)', () => {
    const positive = eveningFeedbackOptions(true).map((o) => o.value);
    const negative = eveningFeedbackOptions(false).map((o) => o.value);
    expect(positive).toEqual(negative);
  });
});
