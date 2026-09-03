import {
  EmotionKey,
  PlutchikVector,
  PlutchikProfile,
  StreakInfo,
  EmotionalGraphEntry,
  UnlockedFeatures,
  EveningFeedback,
  PulseEntry,
  PulseScenario,
  PracticeId,
} from '../types';
import { findOilByName } from '../data/oilDatabase';
import { PRACTICE_BY_ID } from '../data/practices';
import { computeUnlockedFeatures, UNLOCK_DAYS } from './recommendation/unlock';
import { breathingPatternFor } from './recommendation/breathing';
import { colorForDominant } from './recommendation/color';
import { inferEmotionState } from './recommendation/inference';
import { classifyPulse, pulseGate } from './recommendation/pulse';
import { selectPractice, bannedPracticeIds } from './recommendation/practice';
import { computeStreakTransition, missedDays } from './recommendation/streak';
import { EntryContext, YesterdayContext } from './recommendation/entry';
import { getPracticeFeedbackEntries, getPartialSessionFor } from './practiceMemory';
import { resolveApiBaseUrl } from './apiBase';
import {
  NEGATIVE_EMOTIONS,
  detectTimeOfDayPattern,
  flattenEmotionSamples,
  TimeOfDayPattern,
  PatternState,
} from './recommendation/pattern';
import {
  getPatternMemory,
  applyPattern as persistApplyPattern,
  dismissPattern as persistDismissPattern,
  markPatternSeen as persistMarkPatternSeen,
  hasEveningHarderBias,
} from './patternMemory';
import {
  saveEmotionalGraphEntry,
  getEmotionalGraphEntry,
  getEmotionalGraphEntries,
  saveEveningFeedbackFirestore,
  saveEmotionalGraphPulse,
  getPlutchikProfile,
  savePlutchikProfile,
  getStreakInfo,
  saveStreakInfo,
} from './firestoreService';
import { detectCrisis, CrisisDetectedError } from './recommendation/safety';
import { readDevStreakOverride } from './devStreakOverride';
import { readDevEntryOverride, buildDevEntryContext } from './devBridgeOverride';

const DEFAULT_PLUTCHIK: PlutchikVector = {
  joy: 0.5,
  trust: 0.6,
  fear: 0.2,
  surprise: 0.3,
  sadness: 0.2,
  disgust: 0.1,
  anger: 0.2,
  anticipation: 0.6,
};

const defaultProfile = (): PlutchikProfile => ({
  baseline: DEFAULT_PLUTCHIK,
  lastWeekly: DEFAULT_PLUTCHIK,
  trends: {
    joy: 'стабильно',
    trust: 'стабильно',
    fear: 'стабильно',
    surprise: 'стабильно',
    sadness: 'стабильно',
    disgust: 'стабильно',
    anger: 'стабильно',
    anticipation: 'стабильно',
  },
  lastWeeklyDate: new Date().toISOString().split('T')[0],
});

const defaultStreak = (): StreakInfo => ({
  current: 1,
  longest: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
});

/**
 * Единый сервис контура рекомендации (Плутчик). Асинхронный, userId-скоупленный:
 * Firestore — персистентная правда, localStorage — офлайн-кеш (см. firestoreService).
 */
export class CompassService {
  private currentUserId: string = 'guest';
  private static readonly INPUT_PREF_PREFIX = 'app_preferred_input_';
  private static readonly BRIDGE_PREFIX = 'entry_bridge_';

  /** Вызывается экраном при монтировании, чтобы привязать операции к аккаунту. */
  public setCurrentUserId(uid: string | null | undefined): void {
    this.currentUserId = uid || 'guest';
  }

  /** Предпочтительный способ ввода в ритуале: «писать» (tap) или «говорить» (voice). */
  public getPreferredInput(): 'tap' | 'voice' {
    const raw = localStorage.getItem(`${CompassService.INPUT_PREF_PREFIX}${this.currentUserId}`);
    return raw === 'voice' ? 'voice' : 'tap';
  }

  public savePreferredInput(input: 'tap' | 'voice'): void {
    localStorage.setItem(`${CompassService.INPUT_PREF_PREFIX}${this.currentUserId}`, input);
  }

  /** Пометить «Утренний мост» показанным сегодня (гейт дашборда читает этот маркер). */
  public markBridgeShown(): void {
    try {
      localStorage.setItem(`${CompassService.BRIDGE_PREFIX}${this.currentUserId}`, this.getTodayDateStr());
    } catch {}
  }

  /** Показывался ли «Утренний мост» сегодня для текущего пользователя. */
  public isBridgeShownToday(): boolean {
    try {
      return localStorage.getItem(`${CompassService.BRIDGE_PREFIX}${this.currentUserId}`) === this.getTodayDateStr();
    } catch {
      return false;
    }
  }

  public getTodayDateStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  // --- Плутчик-профиль ---

  public getProfile(): Promise<PlutchikProfile> {
    return getPlutchikProfile(this.currentUserId, defaultProfile());
  }

  public async saveBaseline(baseline: PlutchikVector): Promise<PlutchikProfile> {
    const profile = await this.getProfile();
    profile.baseline = baseline;
    profile.lastWeekly = baseline;
    profile.lastWeeklyDate = this.getTodayDateStr();
    return savePlutchikProfile(this.currentUserId, profile);
  }

  // --- Streak и разблокировка фич ---

  public getStreak(): Promise<StreakInfo> {
    // Dev-only: принудительный день стрика (ползунок на дашборде) подменяет реальное
    // значение, чтобы вручную прогнать все пороги разблокировок. lastActiveDate = «сегодня»,
    // поэтому registerDailyActivity не будет ничего инкрементировать и не испортит реальный стрик.
    const override = readDevStreakOverride();
    if (override !== null) {
      return Promise.resolve({ current: override, longest: override, lastActiveDate: this.getTodayDateStr() });
    }
    return getStreakInfo(this.currentUserId, defaultStreak());
  }

  public async registerDailyActivity(): Promise<StreakInfo> {
    const streak = await this.getStreak();
    const today = this.getTodayDateStr();
    const next = computeStreakTransition(streak, today);
    // Уже активны сегодня (lastActiveDate не изменился) — не пишем и не инкрементируем.
    if (next.lastActiveDate === streak.lastActiveDate) return streak;
    return saveStreakInfo(this.currentUserId, next);
  }

  public async getUnlockedFeatures(): Promise<UnlockedFeatures> {
    const streak = await this.getStreak();
    // Разблокировки — от лучшего стрика: пропуски не отбирают уже открытые фичи.
    return computeUnlockedFeatures(streak.longest);
  }

  /**
   * Контекст «Утреннего моста»: вчерашняя запись, стрик, время суток, признаки
   * прерванной практики / критического пульса / дня-разблокировки. Чистый сбор данных —
   * сценарий определяет `determineEntryScenario` на стороне экрана.
   */
  public async getEntryContext(): Promise<EntryContext> {
    // Dev-only: подмена вчерашнего контекста для ручного прогона сценариев моста.
    const devScenario = readDevEntryOverride();
    if (devScenario !== null) {
      return buildDevEntryContext(devScenario);
    }

    const today = this.getTodayDateStr();
    const yesterday = this.getYesterdayDateStr();
    const [streak, yesterdayEntry] = await Promise.all([
      this.getStreak(),
      getEmotionalGraphEntry(this.currentUserId, yesterday),
    ]);

    const yesterdaySession = getPartialSessionFor(this.currentUserId, yesterday);
    const hadCriticalPulse = (yesterdayEntry?.pulses ?? []).some((p) => p.criticalShift);

    // Свежие записи несут practiceId; для старых — пересчёт по доминанте вчерашнего дня.
    const practiceId = yesterdayEntry?.practiceId
      ?? (yesterdayEntry ? this.computePracticeId(yesterdayEntry.dominant) : undefined);
    // Доля пройденной практики (0..1): сырой progress — секунды, нормируем к длительности.
    const duration = practiceId ? (PRACTICE_BY_ID[practiceId]?.durationSeconds ?? 0) : 0;
    const practiceProgress =
      yesterdaySession && duration > 0
        ? Math.min(1, yesterdaySession.progress / duration)
        : 0;

    const yesterdayCtx: YesterdayContext = {
      completed: !!yesterdayEntry,
      eveningFeedbackDone: !!yesterdayEntry?.eveningFeedback,
      practiceInterrupted: !!yesterdaySession,
      practiceProgress,
      hadCriticalPulse,
      color: yesterdayEntry?.color,
      oil: yesterdayEntry?.aroma,
      practiceId,
    };

    const next = computeStreakTransition(streak, today);
    const unlockDays = new Set<number>(Object.values(UNLOCK_DAYS));

    return {
      timeOfDay: this.getTimeOfDay(),
      streak,
      missed: missedDays(streak, today),
      yesterday: yesterdayCtx,
      today: { isUnlockDay: unlockDays.has(next.current) },
    };
  }

  /** Вчерашняя дата `YYYY-MM-DD` в той же UTC-системе, что и getTodayDateStr. */
  public getYesterdayDateStr(): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  }

  /** Время суток для приветствия (по локальному часу). */
  private getTimeOfDay(): 'morning' | 'day' | 'evening' {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'day';
    return 'evening';
  }

  /** Детерминированная практика дня по доминанте + бан «не помогло». */
  private computePracticeId(dominant: EmotionKey): PracticeId {
    const feedback = getPracticeFeedbackEntries(this.currentUserId);
    const banned = bannedPracticeIds(feedback, new Date());
    // Применённый паттерн «вечером тяжелее» → для негативных эмоций предпочитаем
    // успокаивающую практику (низкая активация), а не «разогревающую» по умолчанию.
    const preferCalm = hasEveningHarderBias(this.currentUserId) && NEGATIVE_EMOTIONS.includes(dominant);
    return selectPractice(dominant, preferCalm ? 'low' : undefined, banned);
  }

  // --- Записи эмоционального графа ---

  public getTodayEntry(): Promise<EmotionalGraphEntry | null> {
    return getEmotionalGraphEntry(this.currentUserId, this.getTodayDateStr());
  }

  public getRecentEntries(count = 7): Promise<EmotionalGraphEntry[]> {
    return getEmotionalGraphEntries(this.currentUserId, count);
  }

  /** Вся история чек-инов (по убыванию даты) — для экрана «История». */
  public getHistory(): Promise<EmotionalGraphEntry[]> {
    return getEmotionalGraphEntries(this.currentUserId);
  }

  // --- «Паттерны»: наблюдения из истории ---

  /**
   * Текущее состояние паттернов: разблокированы ли (день 21), есть ли наблюдение
   * «время суток», и новое ли оно (ещё не показано/отклонено/применено).
   */
  public async getPatternState(): Promise<PatternState> {
    const streak = await this.getStreak();
    const unlocked = streak.longest >= UNLOCK_DAYS.patterns;
    const history = await this.getHistory();
    const samples = flattenEmotionSamples(history);
    const pattern = detectTimeOfDayPattern(samples);

    const mem = getPatternMemory(this.currentUserId);
    const isNew = !!pattern && !this.isPatternHandled(pattern.id, mem);

    return { unlocked, pattern, isNew, sampleCount: samples.length };
  }

  private isPatternHandled(id: string, mem: ReturnType<typeof getPatternMemory>): boolean {
    return (
      mem.seen.includes(id) ||
      mem.dismissed.includes(id) ||
      mem.applied.some((a) => a.id === id)
    );
  }

  /** «Учесть в рекомендациях»: применяем паттерн — движок начнёт учитывать его. */
  public applyPattern(pattern: TimeOfDayPattern): void {
    persistApplyPattern(this.currentUserId, {
      id: pattern.id,
      emotion: pattern.emotion,
      direction: pattern.direction,
      appliedAt: this.getTodayDateStr(),
    });
  }

  /** «Не показывать»: отклоняем наблюдение. */
  public dismissPattern(pattern: TimeOfDayPattern): void {
    persistDismissPattern(this.currentUserId, pattern.id);
  }

  /** Помечаем наблюдение показанным, чтобы не дублировать его в следующие дни. */
  public markPatternSeen(pattern: TimeOfDayPattern): void {
    persistMarkPatternSeen(this.currentUserId, pattern.id);
  }

  public async saveDailyEntry(entry: EmotionalGraphEntry): Promise<EmotionalGraphEntry> {
    await this.registerDailyActivity();
    return saveEmotionalGraphEntry(this.currentUserId, entry);
  }

  public saveEveningFeedback(date: string, feedback: EveningFeedback): Promise<EmotionalGraphEntry | null> {
    return saveEveningFeedbackFirestore(this.currentUserId, date, feedback);
  }

  // --- «Пульс дня»: повторный чек-ин состояния ---

  /** Состояние пульса за сегодня: число пульсов, кулдаун, нужен ли сдвиг фокуса. */
  public async getPulseState(): Promise<{
    count: number;
    cooldownRemaining: number;
    focusCare: boolean;
  }> {
    const entry = await this.getTodayEntry();
    const pulses = entry?.pulses ?? [];
    const gate = pulseGate(pulses, Date.now());
    return {
      count: pulses.length,
      cooldownRemaining: gate.reason === 'cooldown' ? gate.cooldownRemaining : 0,
      focusCare: pulses.length + 1 >= 3,
    };
  }

  /**
   * Записать «Пульс дня». НЕ трогает стрик/разблокировки и масло дня:
   * только дописывает pulse в запись за сегодня. Возвращает gate-отказ или результат.
   */
  public async recordPulse(
    microInput: string,
    inputType: 'tap' | 'voice' | 'quick',
    careAction?: 'break' | 'water' | 'move' | 'silence'
  ): Promise<
    | { gate: 'cooldown' | 'limit' }
    | { entry: EmotionalGraphEntry; pulse: PulseEntry; scenario: PulseScenario }
  > {
    const entry = await this.getTodayEntry();
    if (!entry) return { gate: 'limit' }; // нет якорного ритуала — пульсу не от чего отталкиваться

    const pulses = entry.pulses ?? [];
    const gate = pulseGate(pulses, Date.now());
    if (!gate.allowed) return { gate: gate.reason ?? 'limit' };

    // Сдвиг фокуса: на 3+ чекине фиксируем заботу о себе, а не новую эмоцию (без Δ, без практики).
    if (careAction) {
      const pulse: PulseEntry = {
        timestamp: Date.now(),
        microInput,
        inputType,
        vector: { ...entry.plutchikInferred },
        dominant: entry.dominant,
        scenario: 'stable',
        criticalShift: false,
        careAction,
      };
      const updated = await saveEmotionalGraphPulse(this.currentUserId, entry.date, pulse);
      return { entry: updated ?? entry, pulse, scenario: 'stable' };
    }

    const profile = await this.getProfile();
    const { vector, dominant } = inferEmotionState(microInput, profile.baseline);
    const scenario = classifyPulse(entry.plutchikInferred, vector);
    const pulse: PulseEntry = {
      timestamp: Date.now(),
      microInput,
      inputType,
      vector,
      dominant,
      scenario,
      criticalShift: scenario === 'shift',
    };
    const updated = await saveEmotionalGraphPulse(this.currentUserId, entry.date, pulse);
    return { entry: updated ?? entry, pulse, scenario };
  }

  // --- Stuck-детекция ---

  public async checkIsStuck(): Promise<boolean> {
    const entries = await this.getRecentEntries(5);
    if (entries.length < 3) return false;

    const negativeEmotions: EmotionKey[] = ['sadness', 'anger', 'fear', 'disgust'];
    let count = 0;
    for (const e of entries.slice(0, 3)) {
      if (negativeEmotions.includes(e.dominant) && e.eveningFeedback !== 'better') {
        count++;
      }
    }
    return count >= 3;
  }

  // --- Синтез рекомендации (правила + LLM на сервере) ---

  public async generateAISynthesis(
    microInput: string,
    inputType: 'tap' | 'voice' | 'quick' = 'tap'
  ): Promise<EmotionalGraphEntry> {
    // Перехват «красной зоны»: кризисные высказывания не идут в LLM и не сохраняются.
    if (detectCrisis(microInput)) {
      throw new CrisisDetectedError();
    }

    const today = this.getTodayDateStr();
    const isStuck = await this.checkIsStuck();
    const recent = await this.getRecentEntries(7);
    const profile = await this.getProfile();
    const streak = await this.getStreak();

    try {
      const response = await fetch(`${resolveApiBaseUrl()}/api/ai/recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          microInput,
          inputType,
          plutchikProfile: profile,
          emotionalHistory: recent,
          context: {
            streak: streak.current,
            stuckFlag: isStuck,
            hour: new Date().getHours(),
            eveningHarder: hasEveningHarderBias(this.currentUserId),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.crisis) {
          throw new CrisisDetectedError();
        }
        if (data.result && typeof data.result === 'object') {
          const aroma = data.result.aroma || 'Бергамот';
          const dominant: EmotionKey = data.result.dominant || 'anticipation';
          const entry: EmotionalGraphEntry = {
            date: today,
            timestamp: Date.now(),
            microInput,
            inputType,
            plutchikInferred: data.result.plutchikInferred || DEFAULT_PLUTCHIK,
            dominant,
            aroma,
            aromaId: data.result.aromaId || findOilByName(aroma)?.id,
            aromaReason: data.result.aromaReason || 'Поддерживает ясность и мягкое заземление',
            insight: data.result.insight || 'Твой Компас показывает настрой на уверенный шаг вперёд.',
            breathingDone: false,
            breathingPattern: typeof data.result.breathing === 'string' ? data.result.breathing : breathingPatternFor(isStuck),
            color: typeof data.result.color === 'string' ? data.result.color : colorForDominant(dominant),
            tomorrowTeaser: typeof data.result.tomorrowTeaser === 'string' ? data.result.tomorrowTeaser : undefined,
            stuckFlag: isStuck,
            practiceId: this.computePracticeId(dominant),
          };
          return this.saveDailyEntry(entry);
        }
      }
    } catch (e) {
      console.warn('[CompassService] Server synthesis fallback triggered', e);
    }

    const fallbackEntry = this.generateLocalFallback(microInput, inputType, isStuck, profile.baseline);
    return this.saveDailyEntry(fallbackEntry);
  }

  private generateLocalFallback(
    microInput: string,
    inputType: 'tap' | 'voice' | 'quick',
    isStuck: boolean,
    baseline: PlutchikVector
  ): EmotionalGraphEntry {
    const inputLower = microInput.toLowerCase();
    let dominant: EmotionKey = 'anticipation';
    let aroma = 'Бергамот';
    let aromaReason = 'Снимает внутреннее напряжение и помогает переключиться на вдохновляющее действие.';
    let insight = 'Ты держишь фокус на задачах, но тело просит мягкого замедления перед активным стартом.';

    if (inputLower.includes('😔') || inputLower.includes('груст') || inputLower.includes('устал')) {
      dominant = 'sadness';
      aroma = 'Лаванда';
      aromaReason = 'Мягко снижает уровень кортизола и возвращает чувство безопасности.';
      insight = 'Грусть или усталость — это сигнал о том, что твой ресурс на пределе. Дай себе 60 секунд тишины.';
    } else if (inputLower.includes('😊') || inputLower.includes('радост') || inputLower.includes('отлич')) {
      dominant = 'joy';
      aroma = 'Дикий Апельсин';
      aromaReason = 'Усиливает жизненную энергию и закрепляет позитивный эмоциональный якорь.';
      insight = 'Отличный уровень энергии. Используй этот момент для создания устойчивого состояния на весь день.';
    } else if (inputLower.includes('тревог') || inputLower.includes('страх') || inputLower.includes('волнен')) {
      dominant = 'fear';
      aroma = 'Ладан';
      aromaReason = 'Глубоко умиротворяет ум, замедляет дыхание и снимает поверхностную тревожность.';
      insight = 'Тревога — это неопределенность будущего. Дыхание возвращает тебя в единственную реальность — «Здесь и сейчас».';
    }

    if (isStuck) {
      aroma = 'Иланг-Иланг';
      aromaReason = 'Помогает разморозить накопившееся внутреннее сопротивление и смягчить напряжение.';
      insight = 'Твой Компас заметил, что последние дни даются нелегко. Это не ошибка, а сигнал сбавить темп.';
    }

    const inferred: PlutchikVector = {
      ...baseline,
      [dominant]: Math.min(1.0, (baseline[dominant] || 0.5) + 0.2),
    };

    return {
      date: this.getTodayDateStr(),
      timestamp: Date.now(),
      microInput,
      inputType,
      plutchikInferred: inferred,
      dominant,
      aroma,
      aromaId: findOilByName(aroma)?.id,
      aromaReason,
      insight,
      breathingDone: false,
      breathingPattern: breathingPatternFor(isStuck),
      color: colorForDominant(dominant),
      tomorrowTeaser: 'Завтра твой Компас снова подскажет, куда направить внимание.',
      stuckFlag: isStuck,
      practiceId: this.computePracticeId(dominant),
    };
  }
}

export const compassService = new CompassService();
