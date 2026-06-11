import { AiActionResponse, AnalyticsSummary, BehaviorSignal, ChatMessageDto, Insight } from '@/modules/ai/models/ai.types';

export interface AiRemoteDataSource {
  action(text: string, history?: ChatMessageDto[]): Promise<AiActionResponse>;
  getAnalyticsSummary(date?: string): Promise<AnalyticsSummary>;
  getBehaviorSignals(from?: string, to?: string): Promise<BehaviorSignal[]>;
  getInsights(from?: string, to?: string): Promise<Insight[]>;
}
