import { Injectable } from '@nestjs/common';

export interface EndpointStats {
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  byEndpoint: Record<string, EndpointStats>;
}

@Injectable()
export class AiUsageTrackingService {
  private readonly stats: UsageStats = {
    totalRequests: 0,
    totalTokens: 0,
    byEndpoint: {},
  };

  record(
    endpoint: string,
    tokens: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    },
  ): void {
    this.stats.totalRequests++;
    this.stats.totalTokens += tokens.totalTokens;

    if (!this.stats.byEndpoint[endpoint]) {
      this.stats.byEndpoint[endpoint] = {
        requests: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };
    }

    const ep = this.stats.byEndpoint[endpoint];
    ep.requests++;
    ep.promptTokens += tokens.promptTokens;
    ep.completionTokens += tokens.completionTokens;
    ep.totalTokens += tokens.totalTokens;
  }

  getStats(): UsageStats {
    return { ...this.stats, byEndpoint: { ...this.stats.byEndpoint } };
  }
}
