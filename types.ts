
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
