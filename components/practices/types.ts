import { EmotionKey } from '../../types';

/**
 * Контракт «дорожки» внутри плеера практик. Каждая из 8 практик — компонент,
 * который получает длительность, доминирующую эмоцию, цвет дня и колбэки прогресса.
 */
export interface PracticeTrackProps {
  /** Длительность без 3-секундного prep-шлюза. */
  durationSeconds: number;
  dominant: EmotionKey;
  /** userId — нужен практикам с локальным черновиком (Expressive Writing). */
  uid: string;
  /** Цвет дня (hex) — для фоновых заливок «sitting»/«thermal». */
  dayColor?: string;
  /** Затравки для Expressive Writing (AI или локальный фолбэк). */
  starters?: string[];
  /** Вызывается ОДИН раз по завершении дорожки. */
  onFinish: (completed: boolean) => void;
  /** Живые секунды — для сохранения прогресса при прерывании. */
  onProgress: (seconds: number) => void;
}
