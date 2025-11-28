export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'debit' | 'credit';
  amount: number;
  balance?: number;
}

export interface AnalysisSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  topCategories: { name: string; value: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
  sources?: { uri: string; title: string }[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  LEDGER = 'LEDGER',
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS'
}

export type AIProvider = 'gemini' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string; // Required for OpenAI
}
