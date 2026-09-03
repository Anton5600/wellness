/**
 * Паттерн дыхания для практики «1-мин ингаляция».
 * Детерминированное правило (не LLM): stuck-режим использует укороченный
 * цикл 4-4-4 (45–60с), обычный ритуал — 4-4-6 (вдох 4с → задержка 4с → выдох 6с).
 */
export const PATTERN_DEFAULT = '4-4-6';
export const PATTERN_STUCK = '4-4-4';

export const breathingPatternFor = (stuck: boolean): string =>
  stuck ? PATTERN_STUCK : PATTERN_DEFAULT;

/** Разбор строки «вдох-задержка-выдох» в кортеж секунд; невалидное → 4-4-6. */
export const parseBreathPattern = (pattern?: string): [number, number, number] => {
  if (typeof pattern !== 'string') return [4, 4, 6];
  const parts = pattern.split('-').map((s) => Number(s.trim()));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n) || n <= 0)) {
    return [4, 4, 6];
  }
  return [parts[0], parts[1], parts[2]];
};
