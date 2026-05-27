import { AiRemoteDataSource } from '@/modules/ai/api/aiRemoteDataSource';
import { AiRepository } from '@/modules/ai/repository/aiRepository';
import { ChatMessageDto } from '@/modules/ai/models/ai.types';

export class AiRepositoryImpl implements AiRepository {
  constructor(private readonly remote: AiRemoteDataSource) {}

  async action(text: string, history?: ChatMessageDto[]) {
    return this.remote.action(text, history);
  }

  async getAnalyticsSummary(date?: string) {
    return this.remote.getAnalyticsSummary(date);
  }

  async getBehaviorSignals(from?: string, to?: string) {
    return this.remote.getBehaviorSignals(from, to);
  }

  async getInsights(from?: string, to?: string) {
    return this.remote.getInsights(from, to);
  }
}
