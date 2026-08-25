import { describe, it, expect } from 'vitest';
import { bannedOilIds } from './effectiveness';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-08-25T12:00:00Z');

describe('bannedOilIds', () => {
  it('пустая история → пустое множество', () => {
    expect(bannedOilIds([], now).size).toBe(0);
  });

  it('«Не помогло» в окне бана → масло в бане', () => {
    const banned = bannedOilIds(
      [{ oilId: 'lavender', feedback: 'worse', timestamp: now.getTime() - DAY }],
      now
    );
    expect(banned.has('lavender')).toBe(true);
  });

  it('«Не помогло» старше banDays → не в бане', () => {
    const banned = bannedOilIds(
      [{ oilId: 'lavender', feedback: 'worse', timestamp: now.getTime() - 8 * DAY }],
      now
    );
    expect(banned.has('lavender')).toBe(false);
  });

  it('«Лучше»/«Без изменений» не банят', () => {
    const banned = bannedOilIds(
      [
        { oilId: 'a', feedback: 'better', timestamp: now.getTime() - DAY },
        { oilId: 'b', feedback: 'same', timestamp: now.getTime() - DAY },
      ],
      now
    );
    expect(banned.size).toBe(0);
  });

  it('граница окна: ровно banDays назад ещё в бане', () => {
    const banned = bannedOilIds(
      [{ oilId: 'lavender', feedback: 'worse', timestamp: now.getTime() - 7 * DAY }],
      now
    );
    expect(banned.has('lavender')).toBe(true);
  });
});
