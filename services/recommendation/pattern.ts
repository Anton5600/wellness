import { EmotionKey, PlutchikVector, EmotionalGraphEntry, PracticeId } from '../../types';
import { EMOTION_LABELS } from './inference';
import { chronotypeForHour } from './chronotype';
import { selectPractice } from './practice';
import { PRACTICE_BY_ID } from '../../data/practices';

/**
 * Детекция закономерностей «время суток» из истории эмоций — чистая логика «Паттернов».
 * Сравниваем «негативность» утренних и вечерних сэмплов: если вечером заметно тяжелее
 * (или утром) — формулируем наблюдение + конкретное действие. Без сайд-эффектов.
 */

export const NEGATIVE_EMOTIONS: readonly EmotionKey[] = ['sadness', 'fear', 'anger', 'disgust'];

export type TimeOfDayDirection = 'evening_harder' | 'morning_harder';

export interface TimeOfDayPattern {
  id: string;
  kind: 'time_of_day';
  /** «Тяжёлое» время суток (куда нарастает негатив). */
  direction: TimeOfDayDirection;
  /** Негативная эмоция, которая нарастает в «тяжёлое» время. */
  emotion: EmotionKey;
  /** Успокаивающая практика для этой эмоции — кнопка «Попробовать сейчас». */
  practiceId: PracticeId;
  /** Время напоминания (для кнопки «Напомнить»). */
  reminder: { hour: number; minute: number };
  /** Наблюдение (не системное сообщение). */
  statement: string;
  /** Действие с конкретным временем. */
  suggestion: string;
}

/** Сводка для UI: разблокированы ли паттерны, есть ли наблюдение, новое ли оно. */
export interface PatternState {
  unlocked: boolean;
  pattern: TimeOfDayPattern | null;
  /** Наблюдение ещё не показывалось/не отклонено/не применено. */
  isNew: boolean;
  sampleCount: number;
}

/** Один эмоциональный сэмпл с временем — якорный ритуал или «пульс дня». */
export interface EmotionSample {
  timestamp: number;
  vector?: PlutchikVector;
  dominant: EmotionKey;
}

/** Раскладывает историю в плоский список сэмплов: записи + их пульсы. */
export const flattenEmotionSamples = (entries: EmotionalGraphEntry[]): EmotionSample[] => {
  const samples: EmotionSample[] = [];
  for (const e of entries) {
    samples.push({ timestamp: e.timestamp, vector: e.plutchikInferred, dominant: e.dominant });
    for (const p of e.pulses ?? []) {
      samples.push({ timestamp: p.timestamp, vector: p.vector, dominant: p.dominant });
    }
  }
  return samples;
};

const negativityOf = (s: EmotionSample): number => {
  if (s.vector) {
    return NEGATIVE_EMOTIONS.reduce((sum, k) => sum + (s.vector[k] ?? 0), 0) / NEGATIVE_EMOTIONS.length;
  }
  return NEGATIVE_EMOTIONS.includes(s.dominant) ? 1 : 0;
};

const average = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Самая частая негативная доминанта в сэмплах (по порядку при равенстве). */
const mostFrequentNegative = (samples: EmotionSample[]): EmotionKey | null => {
  const counts = new Map<EmotionKey, number>();
  for (const s of samples) {
    if (NEGATIVE_EMOTIONS.includes(s.dominant)) {
      counts.set(s.dominant, (counts.get(s.dominant) ?? 0) + 1);
    }
  }
  let best: EmotionKey | null = null;
  let bestCount = 0;
  for (const e of NEGATIVE_EMOTIONS) {
    const c = counts.get(e) ?? 0;
    if (c > bestCount) {
      bestCount = c;
      best = e;
    }
  }
  return best;
};

const buildPattern = (direction: TimeOfDayDirection, emotion: EmotionKey): TimeOfDayPattern => {
  const label = EMOTION_LABELS[emotion].toLowerCase();
  const practiceId = selectPractice(emotion, 'low');
  const practice = PRACTICE_BY_ID[practiceId];
  const reminder = direction === 'evening_harder' ? { hour: 17, minute: 30 } : { hour: 8, minute: 0 };
  const reminderLabel = `${reminder.hour}:${String(reminder.minute).padStart(2, '0')}`;
  const statement =
    direction === 'evening_harder'
      ? `Я замечаю, что к вечеру ${label} нарастает, а утром ты обычно спокойнее.`
      : `Я замечаю, что с утра ${label} сильнее, а к вечеру отпускает.`;
  const suggestion =
    direction === 'evening_harder'
      ? `Попробуй «${practice.title}» около ${reminderLabel} — до того, как волна поднимется.`
      : `Попробуй «${practice.title}» с утра — чтобы день начался ровнее.`;
  return {
    id: `tod:${direction}:${emotion}`,
    kind: 'time_of_day',
    direction,
    emotion,
    practiceId,
    reminder,
    statement,
    suggestion,
  };
};

/**
 * Определяет паттерн «время суток». Нужно минимум `minPerBucket` сэмплов и в утре, и в
 * вечере; разница средней «негативности» должна превышать `delta` (0..1).
 */
export const detectTimeOfDayPattern = (
  samples: EmotionSample[],
  minPerBucket = 2,
  delta = 0.15
): TimeOfDayPattern | null => {
  const morning: EmotionSample[] = [];
  const evening: EmotionSample[] = [];
  for (const s of samples) {
    const ct = chronotypeForHour(new Date(s.timestamp).getHours());
    if (ct === 'morning') morning.push(s);
    else if (ct === 'evening') evening.push(s);
  }

  if (morning.length < minPerBucket || evening.length < minPerBucket) return null;

  const d = average(evening.map(negativityOf)) - average(morning.map(negativityOf));
  if (d >= delta) {
    const emotion = mostFrequentNegative(evening) ?? 'fear';
    return buildPattern('evening_harder', emotion);
  }
  if (d <= -delta) {
    const emotion = mostFrequentNegative(morning) ?? 'fear';
    return buildPattern('morning_harder', emotion);
  }
  return null;
};
