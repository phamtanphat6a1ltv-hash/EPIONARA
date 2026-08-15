export interface Journal {
  id: string;
  date: string;
  score: number;
  note: string;
  ts?: number;
  sleep?: number;
  activity?: number;
  hydration?: number;
  userId?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
  passwordHash?: string;
  salt?: string;
  birthday?: string;
  join_date?: string;
  plan_type?: string;
  subscription_expires_at?: string;
  payment_customer_id?: string;
}

export interface AIAnalysis {
  id: string;
  ts: number;
  input: string;
  result: {
    emotion: string;
    positive: number;
    intensity: number;
    analysis: string;
    advice: string;
    healing: string;
    tags: string[];
    emoji: string;
    suggested_game?: string;
    radar?: Array<{ subject: string; A: number }>;
  };
}

export interface MoodEntry {
  score: number;
  note: string;
  date?: string;
  sleep?: number;
  activity?: number;
  hydration?: number;
  ts?: number;
}

export interface TestResult {
  type: string;
  score: string;
  savedAt: number;
}
