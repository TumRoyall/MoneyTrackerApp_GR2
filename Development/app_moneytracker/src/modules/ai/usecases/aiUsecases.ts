import { AiRepository } from '@/modules/ai/repository/aiRepository';
import { ChatMessageDto } from '@/modules/ai/models/ai.types';

export const createAiUsecases = (repository: AiRepository) => ({
  action: (text: string, history?: ChatMessageDto[]) => repository.action(text, history),
  getAnalyticsSummary: (date?: string) => repository.getAnalyticsSummary(date),
  getBehaviorSignals: (from?: string, to?: string) => repository.getBehaviorSignals(from, to),
  getInsights: (from?: string, to?: string) => repository.getInsights(from, to),
});
