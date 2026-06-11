import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';

export interface AiBudgetDraftRequest {
  income: number;
  userPrompt?: string;
  walletId?: string | null;
  periodStart: string;
  periodEnd: string;
}

export interface AiBudgetDraftItem {
  categoryId: string;
  categoryName: string;
  percent: number;
  amount: number;
  aiReasoning?: string | null;
}

export interface AiBudgetDraftSummary {
  totalIncome: number;
  totalPercent: number;
  totalBudget: number;
  savingsPercent: number;
  savingsAmount: number;
  strategy: string;
}

export interface AiBudgetDraftResponse {
  draftId: string;
  items: AiBudgetDraftItem[];
  summary: AiBudgetDraftSummary;
}

export interface BatchBudgetItemInput {
  categoryId: string;
  percent: number;
  amount: number;
  aiReasoning?: string | null;
}

export interface BatchCreateBudgetsInput {
  draftId: string;
  walletId?: string | null;
  periodStart: string;
  periodEnd: string;
  periodType: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  income: number;
  items: BatchBudgetItemInput[];
}

export interface BatchCreateBudgetResponse {
  budgets: Array<{
    budgetId: string;
    walletId: string | null;
    categoryId: string;
    amountLimit: number;
    source?: string;
    aiReasoning?: string | null;
    draftId?: string;
    [key: string]: unknown;
  }>;
}

const round = (n: number) => Math.round(n);

export const aiBudgetApi = {
  async generateDraft(req: AiBudgetDraftRequest): Promise<AiBudgetDraftResponse> {
    const { data } = await httpClient.post<ApiResponse<AiBudgetDraftResponse>>(
      '/api/ai/budget/draft',
      req,
      // 60s timeout â€” Gemini flash can take 20-40s on first call (cold start).
      { timeout: 60_000 },
    );
    return data.data;
  },

  async batchCreate(req: BatchCreateBudgetsInput): Promise<BatchCreateBudgetResponse['budgets']> {
    const payload = {
      ...req,
      items: req.items.map((i) => ({
        ...i,
        percent: round(i.percent),
        amount: round(i.amount),
      })),
    };
    const { data } = await httpClient.post<ApiResponse<BatchCreateBudgetResponse>>(
      '/api/budgets/batch',
      payload,
    );
    return data.data.budgets;
  },
};
