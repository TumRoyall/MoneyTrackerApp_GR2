export type AiIntent =
  | 'LOG_TRANSACTION'
  | 'SPENDING_QUERY'
  | 'BUDGET_QUERY'
  | 'INSIGHT_REQUEST'
  | 'COACHING'
  | 'UNKNOWN'
  | string;

export interface ChatMessageDto {
  role: string;
  message: string;
  createdAt: number;
}

export interface AiActionMeta {
  intentConfidence: number;
  aiProvider: string;
  aiFallbackUsed: boolean;
  suggestions: string[];
}

export interface AiActionResponse {
  intent: AiIntent;
  structuredResult: Record<string, unknown>;
  message: string;
  meta: AiActionMeta;
}

export interface AnalyticsSummary {
  periodStart: string;
  periodEnd: string;
  totalIncome: number;
  totalExpense: number;
  topCategoryName: string;
  topCategoryAmount: number;
}

export interface BehaviorSignal {
  type: string;
  severity: string;
  windowStart: string;
  windowEnd: string;
  evidence: string;
}

export interface Insight {
  type: string;
  severity: string;
  message: string;
}
