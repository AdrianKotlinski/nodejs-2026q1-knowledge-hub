import { Injectable } from '@nestjs/common';

export interface EndpointMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
}

@Injectable()
export class AiObservabilityService {
  private readonly metrics: Record<string, EndpointMetrics> = {};

  recordRequest(endpoint: string, latencyMs: number, cacheHit: boolean): void {
    if (!this.metrics[endpoint]) {
      this.metrics[endpoint] = {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        totalLatencyMs: 0,
        avgLatencyMs: 0,
      };
    }

    const m = this.metrics[endpoint];
    m.totalRequests++;
    m.totalLatencyMs += latencyMs;
    m.avgLatencyMs = Math.round(m.totalLatencyMs / m.totalRequests);
    if (cacheHit) m.cacheHits++;
    else m.cacheMisses++;
  }

  getDiagnostics(): Record<string, EndpointMetrics & { cacheHitRatio: string }> {
    return Object.fromEntries(
      Object.entries(this.metrics).map(([k, v]) => [
        k,
        {
          ...v,
          cacheHitRatio:
            v.totalRequests > 0
              ? `${Math.round((v.cacheHits / v.totalRequests) * 100)}%`
              : 'N/A',
        },
      ]),
    );
  }
}
