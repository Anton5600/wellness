import { EveningFeedback } from '../../types';
import { DEFAULT_CONFIG, RecommendationConfig } from './config';

/** Запись вечернего отзыва о конкретном масле. */
export interface EveningFeedbackEntry {
  oilId: string;
  feedback: EveningFeedback;
  timestamp: number;
}

/**
 * Масла, исключённые из рекомендации на ближайшие `banDays` дней:
 * те, по которым за последние `banDays` был отзыв «Не помогло» (`worse`).
 */
export const bannedOilIds = (
  feedback: EveningFeedbackEntry[],
  now: Date,
  cfg: RecommendationConfig = DEFAULT_CONFIG
): Set<string> => {
  const cutoff = now.getTime() - cfg.banDays * 24 * 60 * 60 * 1000;
  const banned = new Set<string>();
  for (const entry of feedback) {
    if (entry.feedback === 'worse' && entry.timestamp >= cutoff) {
      banned.add(entry.oilId);
    }
  }
  return banned;
};
