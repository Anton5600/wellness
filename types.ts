
export type EmotionKey = 'joy' | 'trust' | 'fear' | 'surprise' | 'sadness' | 'disgust' | 'anger' | 'anticipation';

export interface Oil {
  name: string;
  description: string;
  icon: string;
}

export interface OilCatalogItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  price?: number; // Цена в рублях
}

export interface UserOil {
  id: string;
  userId: string;
  oilId: string;
  addedAt: number;
}

export interface EmotionData {
  key: EmotionKey;
  title: string;
  headline: string;
  description: string;
  color: string;
  oils: Oil[];
  usage: string[];
}

export interface QuizAnswer {
  text: string;
  emotionKey: EmotionKey;
}

export interface QuizQuestion {
  id: number;
  question: string;
  subtext: string;
  answers: QuizAnswer[];
}

export interface User {
  uid: string;
  email: string;
  name?: string;
  emailVerified: boolean;
}

export interface EmotionHistoryEntry {
  id: string;
  userId: string;
  timestamp: number;
  emotionKey: EmotionKey;
}

// --- Плутчик-модель (ядро рекомендации) ---

export type PlutchikVector = Record<EmotionKey, number>;

export type EveningFeedback = 'better' | 'same' | 'worse';

export interface CompassSettings {
  morningPushTime: string;
  eveningPushTime: string;
  preferredInput: 'tap' | 'voice';
  timezone: string;
}

export interface PlutchikProfile {
  baseline: PlutchikVector;
  lastWeekly: PlutchikVector;
  trends: Record<EmotionKey, string>;
  lastWeeklyDate: string;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastActiveDate: string;
}

export interface EmotionalGraphEntry {
  date: string;
  timestamp: number;
  microInput: string;
  inputType: 'tap' | 'voice' | 'quick';
  plutchikInferred: PlutchikVector;
  dominant: EmotionKey;
  aroma: string;
  aromaId?: string;
  aromaReason: string;
  insight: string;
  breathingDone: boolean;
  breathingPattern: string;
  /** Цвет дня (hex, из палитры эмоций Плутчика) — фон экрана «Привет». */
  color?: string;
  /** Короткий тизер на завтра (генерирует LLM) — для удержания. */
  tomorrowTeaser?: string;
  stuckFlag: boolean;
  eveningFeedback?: EveningFeedback;
  /** «Пульсы дня» — повторные микро-чекины состояния в течение дня (не якорный ритуал). */
  pulses?: PulseEntry[];
  /** Практика дня, зафиксированная в момент ритуала (не пересчитывается при бане за ночь). */
  practiceId?: PracticeId;
}

// --- «Пульс дня»: повторный чек-ин состояния в течение дня ---

/** Сценарий пульса: A — стабильно (Δ мала), B — резкий сдвиг (Δ велика). */
export type PulseScenario = 'stable' | 'shift';

export interface PulseEntry {
  /** Момент чекина (ms). */
  timestamp: number;
  microInput: string;
  inputType: 'tap' | 'voice' | 'quick';
  /** Состояние (вектор Плутчика) на момент пульса. */
  vector: PlutchikVector;
  dominant: EmotionKey;
  /** Сценарий, который показал движок. */
  scenario: PulseScenario;
  /** Резкий сдвиг (scenario === 'shift'). */
  criticalShift: boolean;
  /** На 3+ чек-ине вместо эмоции спрашиваем «что нужно?» — мягкий уход от накрутки. */
  careAction?: 'break' | 'water' | 'move' | 'silence';
}

export interface UnlockedFeatures {
  morningRitual: boolean;
  eveningCheckin: boolean;
  mapDay: boolean;
  cards: boolean;
  patterns: boolean;
  catalog: boolean;
  exportPdf: boolean;
}

// --- Единая база масел (для правил рекомендации и LLM) ---

export type EffectMode = 'awaken' | 'calm' | 'balance' | 'support';

export type Chronotype = 'morning' | 'day' | 'evening';

export interface OilEffect {
  emotion: EmotionKey;
  mode: EffectMode;
}

export interface OilEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  effects: OilEffect[]; // на какие эмоции и как
  chronotype: Chronotype[]; // утро/день/вечер
  instruction: string; // «1 капля на ладони, 3 вдоха»
  price?: number;
}

// --- Коммерция (магазин отложен, но типы нужны для компиляции) ---

export interface CartItem {
  oilId: string;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: number;
  contactName: string;
  contactPhone: string;
  deliveryAddress: string;
}

// --- Соматические практики заземления (локально, не в Firestore) ---

export type PracticeId =
  | 'bodyScan'
  | 'grounding54321'
  | 'pmr'
  | 'fingerTracing'
  | 'vibroPacing'
  | 'expressiveWriting'
  | 'thermalImagery'
  | 'mantraLoop';

/** Полоса активации нервной системы, на которую рассчитана/в которой предложена практика. */
export type Arousal = 'high' | 'low';

export type PracticeFeedback = 'helped' | 'not_helped';

/** Запись «помогло/не помогло» о практике — источник правила бана по practiceId. */
export interface PracticeFeedbackEntry {
  practiceId: PracticeId;
  dominant: EmotionKey;
  arousal: Arousal;
  feedback: PracticeFeedback;
  timestamp: number;
}

/** Сессия практики (завершённая или прерванная) — для вечернего признания частичного прохождения. */
export interface PracticeSessionRecord {
  practiceId: PracticeId;
  dominant: EmotionKey;
  arousal: Arousal;
  completed: boolean;
  /** Пройдено секунд (0..durationSeconds). */
  progress: number;
  startedAt: number;
}
