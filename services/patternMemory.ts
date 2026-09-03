import { EmotionKey } from '../types';
import { TimeOfDayDirection } from './recommendation/pattern';

/**
 * Локальная память «Паттернов» (только localStorage, без Firestore).
 * Хранит, что показано/отклонено/применено — сама детекция пересчитывается из истории.
 * Применённый паттерн хранит эмоцию и направление, чтобы движок мог скорректировать
 * рекомендацию без повторного пересчёта детекции.
 */

const MEMORY_KEY_PREFIX = 'pattern_memory_';

export interface AppliedPattern {
  id: string;
  emotion: EmotionKey;
  direction: TimeOfDayDirection;
  appliedAt: string;
}

interface PatternMemory {
  applied: AppliedPattern[];
  dismissed: string[];
  seen: string[];
}

const readLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = (key: string, data: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

const readMemory = (uid: string): PatternMemory => {
  const mem = readLocal<PatternMemory | null>(MEMORY_KEY_PREFIX + uid, null);
  if (mem && Array.isArray(mem.applied) && Array.isArray(mem.dismissed) && Array.isArray(mem.seen)) {
    return mem;
  }
  return { applied: [], dismissed: [], seen: [] };
};

const writeMemory = (uid: string, mem: PatternMemory): void => {
  writeLocal(MEMORY_KEY_PREFIX + uid, mem);
};

export const getPatternMemory = (uid: string): PatternMemory => readMemory(uid);

/** «Учесть в рекомендациях» — запоминаем применённый паттерн (идемпотентно по id). */
export const applyPattern = (uid: string, pattern: AppliedPattern): void => {
  const mem = readMemory(uid);
  if (!mem.applied.some((a) => a.id === pattern.id)) {
    mem.applied.push(pattern);
  }
  writeMemory(uid, mem);
};

/** «Не показывать» — отклоняем наблюдение. */
export const dismissPattern = (uid: string, id: string): void => {
  const mem = readMemory(uid);
  if (!mem.dismissed.includes(id)) {
    mem.dismissed.push(id);
  }
  writeMemory(uid, mem);
};

/** Помечаем наблюдение как показанное, чтобы не показывать повторно. */
export const markPatternSeen = (uid: string, id: string): void => {
  const mem = readMemory(uid);
  if (!mem.seen.includes(id)) {
    mem.seen.push(id);
  }
  writeMemory(uid, mem);
};

/** Применён ли «вечером тяжелее» паттерн — признак для смещения рекомендации. */
export const hasEveningHarderBias = (uid: string): boolean =>
  readMemory(uid).applied.some((a) => a.direction === 'evening_harder');
