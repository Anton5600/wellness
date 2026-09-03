import { EmotionKey } from '../../types';

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
