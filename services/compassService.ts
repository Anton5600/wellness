import {
  EmotionKey,
  PlutchikVector,
  CompassSettings,
  PlutchikProfile,
  StreakInfo,
  EmotionalGraphEntry,
  UnlockedFeatures,
  EveningFeedback,
  User,
} from '../types';

const STORAGE_KEYS = {
  USER: 'compass_user',
  SETTINGS: 'compass_settings',
  PROFILE: 'compass_profile',
  STREAK: 'compass_streak',
  GRAPH: 'compass_graph',
  UNLOCKED: 'compass_unlocked',
};

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

const DEFAULT_SETTINGS: CompassSettings = {
  morningPushTime: '08:00',
  eveningPushTime: '21:00',
  preferredInput: 'tap',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

export class CompassService {
  private user: User | null = null;
  private settings: CompassSettings = DEFAULT_SETTINGS;
  private profile: PlutchikProfile;
  private streak: StreakInfo;
  private graph: Record<string, EmotionalGraphEntry> = {};

  constructor() {
    this.user = this.loadJSON(STORAGE_KEYS.USER, null);
    this.settings = this.loadJSON(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    this.profile = this.loadJSON(STORAGE_KEYS.PROFILE, {
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
    this.streak = this.loadJSON(STORAGE_KEYS.STREAK, {
      current: 1,
      longest: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
    });
    this.graph = this.loadJSON(STORAGE_KEYS.GRAPH, {});
    this.updateStreakOnLoad();
  }

  private loadJSON<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  private saveJSON(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  public getTodayDateStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  // User Management
  public getUser(): User | null {
    return this.user;
  }

  public setUser(user: User): void {
    this.user = user;
    this.saveJSON(STORAGE_KEYS.USER, user);
  }

  // Settings Management
  public getSettings(): CompassSettings {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<CompassSettings>): CompassSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveJSON(STORAGE_KEYS.SETTINGS, this.settings);
    return this.settings;
  }

  // Plutchik Profile
  public getProfile(): PlutchikProfile {
    return this.profile;
  }

  public saveBaseline(baseline: PlutchikVector): PlutchikProfile {
    this.profile.baseline = baseline;
    this.profile.lastWeekly = baseline;
    this.profile.lastWeeklyDate = this.getTodayDateStr();
    this.saveJSON(STORAGE_KEYS.PROFILE, this.profile);
    return this.profile;
  }

  public updateWeeklyProfile(weekly: PlutchikVector): PlutchikProfile {
    const oldWeekly = this.profile.lastWeekly || this.profile.baseline;
    const trends: Record<EmotionKey, string> = { ...this.profile.trends };

    (Object.keys(weekly) as EmotionKey[]).forEach((key) => {
      const diff = Math.round((weekly[key] - oldWeekly[key]) * 100);
      if (diff > 5) trends[key] = `рост на +${diff}%`;
      else if (diff < -5) trends[key] = `снижение на ${diff}%`;
      else trends[key] = 'стабильно';
    });

    this.profile.lastWeekly = weekly;
    this.profile.trends = trends;
    this.profile.lastWeeklyDate = this.getTodayDateStr();
    this.saveJSON(STORAGE_KEYS.PROFILE, this.profile);
    return this.profile;
  }

  // Streak & Feature Unlocking
  public getStreak(): StreakInfo {
    return this.streak;
  }

  private updateStreakOnLoad(): void {
    const today = this.getTodayDateStr();
    const lastActive = this.streak.lastActiveDate;

    if (!lastActive) return;

    const todayDate = new Date(today);
    const lastDate = new Date(lastActive);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays > 1) {
      // Missed days
      this.streak.current = 0;
      this.saveJSON(STORAGE_KEYS.STREAK, this.streak);
    }
  }

  public registerDailyActivity(): StreakInfo {
    const today = this.getTodayDateStr();
    if (this.streak.lastActiveDate !== today) {
      this.streak.current += 1;
      if (this.streak.current > this.streak.longest) {
        this.streak.longest = this.streak.current;
      }
      this.streak.lastActiveDate = today;
      this.saveJSON(STORAGE_KEYS.STREAK, this.streak);
    }
    return this.streak;
  }

  public getUnlockedFeatures(): UnlockedFeatures {
    const days = Math.max(1, this.streak.current);
    return {
      morningRitual: true,
      eveningCheckin: days >= 3,
      mapDay: days >= 5,
      weeklyCheck: days >= 7,
      cards: days >= 10,
      patterns: days >= 14,
      catalog: days >= 21,
      exportPdf: days >= 30,
    };
  }

  // Emotional Graph Entries
  public getTodayEntry(): EmotionalGraphEntry | null {
    const today = this.getTodayDateStr();
    return this.graph[today] || null;
  }

  public getRecentEntries(count: number = 7): EmotionalGraphEntry[] {
    const sorted = Object.values(this.graph).sort((a, b) => b.timestamp - a.timestamp);
    return sorted.slice(0, count);
  }

  public saveDailyEntry(entry: EmotionalGraphEntry): EmotionalGraphEntry {
    this.graph[entry.date] = entry;
    this.saveJSON(STORAGE_KEYS.GRAPH, this.graph);
    this.registerDailyActivity();
    return entry;
  }

  public saveEveningFeedback(date: string, feedback: EveningFeedback): EmotionalGraphEntry | null {
    if (this.graph[date]) {
      this.graph[date].eveningFeedback = feedback;
      this.saveJSON(STORAGE_KEYS.GRAPH, this.graph);
      return this.graph[date];
    }
    return null;
  }

  // Stuck Detection
  public checkIsStuck(): boolean {
    const entries = this.getRecentEntries(5);
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

  // AI Synthesis Execution
  public async generateAISynthesis(
    microInput: string,
    inputType: 'tap' | 'voice' = 'tap'
  ): Promise<EmotionalGraphEntry> {
    const today = this.getTodayDateStr();
    const isStuck = this.checkIsStuck();
    const recent = this.getRecentEntries(7);

    try {
      const response = await fetch('/api/ai/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          microInput,
          inputType,
          plutchikProfile: this.profile,
          emotionalHistory: recent,
          context: {
            streak: this.streak.current,
            stuckFlag: isStuck,
            timeOfDay: new Date().getHours() < 12 ? 'morning' : 'day',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result && typeof data.result === 'object') {
          const entry: EmotionalGraphEntry = {
            date: today,
            timestamp: Date.now(),
            microInput,
            inputType,
            plutchikInferred: data.result.plutchikInferred || DEFAULT_PLUTCHIK,
            dominant: data.result.dominant || 'anticipation',
            aroma: data.result.aroma || 'Бергамот',
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

    // Smart Local Fallback
    const fallbackEntry = this.generateLocalFallback(microInput, inputType, isStuck);
    return this.saveDailyEntry(fallbackEntry);
  }

  private generateLocalFallback(
    microInput: string,
    inputType: 'tap' | 'voice',
    isStuck: boolean
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
      ...this.profile.baseline,
      [dominant]: Math.min(1.0, (this.profile.baseline[dominant] || 0.5) + 0.2),
    };

    return {
      date: this.getTodayDateStr(),
      timestamp: Date.now(),
      microInput,
      inputType,
      plutchikInferred: inferred,
      dominant,
      aroma,
      aromaReason,
      insight,
      breathingDone: false,
      breathingPattern: isStuck ? '4-4-4' : '4-4-6',
      stuckFlag: isStuck,
    };
  }
}

export const compassService = new CompassService();
