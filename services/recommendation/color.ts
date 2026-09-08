import { EmotionKey, MixedEmotion } from '../../types';

/**
 * Цвета эмоций Плутчика (hex) — палитра «цвета дня».
 * Совпадают с `components/PlutchikWheel.tsx`, чтобы цвет фона был консистентен колесу.
 */
export const EMOTION_HEX: Record<EmotionKey, string> = {
  joy: '#f59e0b',
  trust: '#10b981',
  fear: '#059669',
  surprise: '#0284c7',
  sadness: '#3b82f6',
  disgust: '#8b5cf6',
  anger: '#ef4444',
  anticipation: '#f97316',
};

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Валиден ли hex-цвет формата #rgb или #rrggbb (регистронезависимо). */
export const isValidHexColor = (value: unknown): value is string =>
  typeof value === 'string' && HEX_RE.test(value);

/** Fallback-цвет дня — цвет доминирующей эмоции. */
export const colorForDominant = (dominant: EmotionKey): string => EMOTION_HEX[dominant];

/** Раскладывает hex-цвет #rrggbb на компоненты RGB (0–255). */
const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.replace('#', '');
  const full = value.length === 3
    ? value.split('').map((c) => c + c).join('')
    : value;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Средний цвет двух эмоций диады (midpoint по RGB) — «цвет дня» для смешанной эмоции. */
export const colorForDyad = (dyad: MixedEmotion): string => {
  const [r1, g1, b1] = hexToRgb(EMOTION_HEX[dyad.emotions[0]]);
  const [r2, g2, b2] = hexToRgb(EMOTION_HEX[dyad.emotions[1]]);
  const mid = (a: number, b: number): number => Math.round((a + b) / 2);
  const toHex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${toHex(mid(r1, r2))}${toHex(mid(g1, g2))}${toHex(mid(b1, b2))}`;
};
