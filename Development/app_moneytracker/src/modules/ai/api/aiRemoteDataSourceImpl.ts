import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import { AiRemoteDataSource } from '@/modules/ai/api/aiRemoteDataSource';
import { AiActionResponse, AnalyticsSummary, BehaviorSignal, ChatMessageDto, Insight } from '@/modules/ai/models/ai.types';

export class AiRemoteDataSourceImpl implements AiRemoteDataSource {
  async action(text: string, history?: ChatMessageDto[]): Promise<AiActionResponse> {
    const response = await httpClient.post<ApiResponse<AiActionResponse>>('/api/ai/action', { text, history });
    return response.data.data;
  }

  async getAnalyticsSummary(date?: string): Promise<AnalyticsSummary> {
    const response = await httpClient.get<ApiResponse<AnalyticsSummary>>('/api/analytics/summary', {
      params: { date },
    });
    return response.data.data;
  }

  async getBehaviorSignals(from?: string, to?: string): Promise<BehaviorSignal[]> {
    const response = await httpClient.get<ApiResponse<BehaviorSignal[]>>('/api/behavior/signals', {
      params: { from, to },
    });
    return response.data.data ?? [];
  }

  async getInsights(from?: string, to?: string): Promise<Insight[]> {
    const response = await httpClient.get<ApiResponse<Insight[]>>('/api/insights', {
      params: { from, to },
    });
    return response.data.data ?? [];
  }
}
