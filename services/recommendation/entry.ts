import { StreakInfo, PracticeId, EveningFeedback } from '../../types';

/**
 * Чистая логика «Утреннего моста» — определение сценария входа в приложение.
 * Зеркало ТЗ: 4 сценария (fresh_day / pending_feedback / unfinished_practice / missed_day)
 * + тёплый фон при вчерашнем критическом пульсе. Калибровка профиля (сценарий 6) отложена.
 * Без сайд-эффектов: читает только переданный контекст, не трогает хранилище.
 */

export type EntryScenario =
  | 'fresh_day'
  | 'pending_feedback'
  | 'unfinished_practice'
  | 'missed_day';

/** Что мы знаем о вчерашнем дне (собирает compassService.getEntryContext). */
export interface YesterdayContext {
  /** Был ли завершён ритуал вчера (есть ли запись за вчерашний день). */
  completed: boolean;
  /** Отмечен ли вечерний фидбек («помогло/так себе/не помогло»). */
  eveningFeedbackDone: boolean;
  /** Прервана ли вчерашняя практика (completed:false). */
  practiceInterrupted: boolean;
  /** Доля пройденной вчерашней практики (0..1) — порог «больше половины». */
  practiceProgress: number;
  /** Был ли вчера критический пульс (criticalShift). */
  hadCriticalPulse: boolean;
  /** Цвет вчерашнего дня (hex). */
  color?: string;
  /** Масло вчерашнего дня. */
  oil?: string;
  /** Практика вчерашнего дня (если записана). */
  practiceId?: PracticeId;
}

export interface EntryContext {
  timeOfDay: 'morning' | 'day' | 'evening';
  streak: StreakInfo;
  /** Пропущено ли дней с последней активности (0/1/2) — для текста «вчера — пауза». */
  missed: 0 | 1 | 2;
  yesterday: YesterdayContext;
  today: { isUnlockDay: boolean };
}

export interface EntryDecision {
  scenario: EntryScenario;
  /** Мягкий тёплый фон вместо нейтрального (вчера был критический пульс). */
  warmBackground: boolean;
}

/**
 * Порядок приоритета сценариев (из ТЗ):
 *  1. !completed && missed>0 → missed_day (пропущенный день);
 *  2. hadCriticalPulse → тёплый фон (подавляет напоминание о незавершённой практике);
 *  3. practiceInterrupted && progress > 0.5 → unfinished_practice;
 *  4. completed && !eveningFeedbackDone → pending_feedback;
 *  5. иначе → fresh_day.
 */
export const determineEntryScenario = (ctx: EntryContext): EntryDecision => {
  const warmBackground = ctx.yesterday.hadCriticalPulse;

  if (!ctx.yesterday.completed && ctx.missed > 0) {
    return { scenario: 'missed_day', warmBackground };
  }

  if (ctx.yesterday.practiceInterrupted && ctx.yesterday.practiceProgress > 0.5) {
    return { scenario: 'unfinished_practice', warmBackground };
  }

  if (ctx.yesterday.completed && !ctx.yesterday.eveningFeedbackDone) {
    return { scenario: 'pending_feedback', warmBackground };
  }

  return { scenario: 'fresh_day', warmBackground };
};

/** Русское приветствие по времени суток. */
const GREETING_BY_TIME: Record<EntryContext['timeOfDay'], string> = {
  morning: 'Доброе утро',
  day: 'Добрый день',
  evening: 'Добрый вечер',
};

/**
 * Приветствие входа: по времени суток + характеру возврата.
 * afterMiss — «с возвращением» (пропуск), returning — уже есть вчерашний ритуал,
 * fresh — первый раз / чистый день.
 */
export const getGreeting = (
  timeOfDay: EntryContext['timeOfDay'],
  streak: StreakInfo,
  yesterdayCompleted: boolean
): string => {
  const base = GREETING_BY_TIME[timeOfDay];
  if (streak.current === 1 && streak.longest === 1) return base;
  if (!yesterdayCompleted) return `${base}, с возвращением`;
  return `${base}, снова с тобой`;
};
