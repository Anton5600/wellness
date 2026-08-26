import {
  EmotionKey,
  PlutchikVector,
  PlutchikProfile,
  StreakInfo,
  EmotionalGraphEntry,
  UnlockedFeatures,
  EveningFeedback,
} from '../types';
import { findOilByName } from '../data/oilDatabase';
import { computeUnlockedFeatures } from './recommendation/unlock';
import {
  saveEmotionalGraphEntry,
  getEmotionalGraphEntry,
  getEmotionalGraphEntries,
  saveEveningFeedbackFirestore,
  getPlutchikProfile,
  savePlutchikProfile,
  getStreakInfo,
  saveStreakInfo,
} from './firestoreService';

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

  /** Вызывается экраном при монтировании, чтобы привязать операции к аккаунту. */
  public setCurrentUserId(uid: string | null | undefined): void {
    this.currentUserId = uid || 'guest';
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

  public async updateWeeklyProfile(weekly: PlutchikVector): Promise<PlutchikProfile> {
    const profile = await this.getProfile();
    const oldWeekly = profile.lastWeekly || profile.baseline;
    const trends: Record<EmotionKey, string> = { ...profile.trends };

    (Object.keys(weekly) as EmotionKey[]).forEach((key) => {
      const diff = Math.round((weekly[key] - oldWeekly[key]) * 100);
      if (diff > 5) trends[key] = `рост на +${diff}%`;
      else if (diff < -5) trends[key] = `снижение на ${diff}%`;
      else trends[key] = 'стабильно';
    });

    profile.lastWeekly = weekly;
    profile.trends = trends;
    profile.lastWeeklyDate = this.getTodayDateStr();
    return savePlutchikProfile(this.currentUserId, profile);
  }

  // --- Streak и разблокировка фич ---

  public getStreak(): Promise<StreakInfo> {
    return getStreakInfo(this.currentUserId, defaultStreak());
  }

  public async registerDailyActivity(): Promise<StreakInfo> {
    const streak = await this.getStreak();
    const today = this.getTodayDateStr();
    if (streak.lastActiveDate !== today) {
      streak.current += 1;
      if (streak.current > streak.longest) {
        streak.longest = streak.current;
      }
      streak.lastActiveDate = today;
      return saveStreakInfo(this.currentUserId, streak);
    }
    return streak;
  }

  public async getUnlockedFeatures(): Promise<UnlockedFeatures> {
    const streak = await this.getStreak();
    return computeUnlockedFeatures(streak.current);
  }

  // --- Записи эмоционального графа ---

  public getTodayEntry(): Promise<EmotionalGraphEntry | null> {
    return getEmotionalGraphEntry(this.currentUserId, this.getTodayDateStr());
  }

  public getRecentEntries(count = 7): Promise<EmotionalGraphEntry[]> {
    return getEmotionalGraphEntries(this.currentUserId, count);
  }

  public async saveDailyEntry(entry: EmotionalGraphEntry): Promise<EmotionalGraphEntry> {
    await this.registerDailyActivity();
    return saveEmotionalGraphEntry(this.currentUserId, entry);
  }

  public saveEveningFeedback(date: string, feedback: EveningFeedback): Promise<EmotionalGraphEntry | null> {
    return saveEveningFeedbackFirestore(this.currentUserId, date, feedback);
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
    inputType: 'tap' | 'voice' = 'tap'
  ): Promise<EmotionalGraphEntry> {
    const today = this.getTodayDateStr();
    const isStuck = await this.checkIsStuck();
    const recent = await this.getRecentEntries(7);
    const profile = await this.getProfile();
    const streak = await this.getStreak();

    try {
      const response = await fetch('/api/ai/recommendation', {
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
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result && typeof data.result === 'object') {
          const aroma = data.result.aroma || 'Бергамот';
          const entry: EmotionalGraphEntry = {
            date: today,
            timestamp: Date.now(),
            microInput,
            inputType,
            plutchikInferred: data.result.plutchikInferred || DEFAULT_PLUTCHIK,
            dominant: data.result.dominant || 'anticipation',
            aroma,
            aromaId: data.result.aromaId || findOilByName(aroma)?.id,
            aromaReason: data.result.aromaReason || 'Поддерживает ясность и мягкое заземление',
            insight: data.result.insight || 'Твой Компас показывает настрой на уверенный шаг вперёд.',
            breathingDone: false,
            breathingPattern: isStuck ? '4-4-4' : '4-4-6',
            stuckFlag: isStuck,
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
    inputType: 'tap' | 'voice',
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
      breathingPattern: isStuck ? '4-4-4' : '4-4-6',
      stuckFlag: isStuck,
    };
  }
}

export const compassService = new CompassService();
