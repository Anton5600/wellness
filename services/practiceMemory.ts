import { PracticeFeedbackEntry, PracticeSessionRecord } from '../types';

/**
 * Локальная память соматических практик (только localStorage, без Firestore).
 * Согласовано: состояние практик и learning-петля «не помогло» живут на устройстве,
 * не синхронизируются между устройствами.
 */

const MEMORY_KEY_PREFIX = 'practice_memory_';
const WRITING_KEY_PREFIX = 'practice_writing_';
const UPDATE_KEY_PREFIX = 'practice_update_';

/** Верхняя граница хранимых записей — защита от неограниченного роста localStorage. */
const MAX_ENTRIES = 100;

interface PracticeMemory {
  feedback: PracticeFeedbackEntry[];
  sessions: PracticeSessionRecord[];
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

const readMemory = (uid: string): PracticeMemory => {
  const mem = readLocal<PracticeMemory | null>(MEMORY_KEY_PREFIX + uid, null);
  if (mem && Array.isArray(mem.feedback) && Array.isArray(mem.sessions)) {
    return mem;
  }
  return { feedback: [], sessions: [] };
};

const writeMemory = (uid: string, mem: PracticeMemory): void => {
  writeLocal(MEMORY_KEY_PREFIX + uid, {
    feedback: mem.feedback.slice(-MAX_ENTRIES),
    sessions: mem.sessions.slice(-MAX_ENTRIES),
  });
};

/** Записать отзыв «помогло/не помогло» — источник правила бана по practiceId. */
export const recordPracticeFeedback = (uid: string, entry: PracticeFeedbackEntry): void => {
  const mem = readMemory(uid);
  mem.feedback.push(entry);
  writeMemory(uid, mem);
};

/** Записать сессию (завершённую или прерванную) — для вечернего признания частичного прохождения. */
export const recordPracticeSession = (uid: string, session: PracticeSessionRecord): void => {
  const mem = readMemory(uid);
  mem.sessions.push(session);
  writeMemory(uid, mem);
};

/** Все отзывы о практиках (по убыванию времени) — вход для bannedPracticeIds. */
export const getPracticeFeedbackEntries = (uid: string): PracticeFeedbackEntry[] =>
  readMemory(uid).feedback.slice().sort((a, b) => b.timestamp - a.timestamp);

/** Прерванная сессия (completed:false) за конкретную дату `YYYY-MM-DD` или null. */
export const getPartialSessionFor = (uid: string, date: string): PracticeSessionRecord | null => {
  const sessions = readMemory(uid).sessions;
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (!s.completed && new Date(s.startedAt).toISOString().split('T')[0] === date) {
      return s;
    }
  }
  return null;
};

/** Сегодняшняя прерванная сессия (completed:false) или null. */
export const getTodayPartialSession = (uid: string): PracticeSessionRecord | null =>
  getPartialSessionFor(uid, new Date().toISOString().split('T')[0]);

/** Драфт Expressive Writing (удаляется после релиза). */
export const saveWritingDraft = (uid: string, text: string): void => {
  writeLocal(WRITING_KEY_PREFIX + uid, text);
};

export const readWritingDraft = (uid: string): string => {
  const raw = readLocal<string | null>(WRITING_KEY_PREFIX + uid, null);
  return typeof raw === 'string' ? raw : '';
};

export const clearWritingDraft = (uid: string): void => {
  try {
    localStorage.removeItem(WRITING_KEY_PREFIX + uid);
  } catch {}
};

/**
 * Счётчик «Обновить практику дня» по дате — ограничение 1 раз/день
 * (сценарий В пульса: переиграть практику под новый вектор, не меняя масло).
 */
export const getPracticeUpdateCount = (uid: string, date: string): number => {
  const map = readLocal<Record<string, number> | null>(UPDATE_KEY_PREFIX + uid, null);
  return map?.[date] ?? 0;
};

export const incrementPracticeUpdate = (uid: string, date: string): number => {
  const map = readLocal<Record<string, number>>(UPDATE_KEY_PREFIX + uid, {});
  map[date] = (map[date] ?? 0) + 1;
  writeLocal(UPDATE_KEY_PREFIX + uid, map);
  return map[date];
};
