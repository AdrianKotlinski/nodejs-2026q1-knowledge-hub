import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface WindowEntry {
  count: number;
  windowStart: number;
}

@Injectable()
export class AiRateLimitService {
  private readonly windows = new Map<string, WindowEntry>();
  private readonly rpm = parseInt(process.env.AI_RATE_LIMIT_RPM ?? '20', 10);
  private readonly windowMs = 60_000;

  check(clientId: string): void {
    const now = Date.now();
    const entry = this.windows.get(clientId);

    if (!entry || now - entry.windowStart > this.windowMs) {
      this.windows.set(clientId, { count: 1, windowStart: now });
      return;
    }

    if (entry.count >= this.rpm) {
      const retryAfter = Math.ceil(
        (this.windowMs - (now - entry.windowStart)) / 1000,
      );
      throw new HttpException(
        { message: 'Rate limit exceeded', retryAfter },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count++;
  }

  getRetryAfter(clientId: string): number {
    const entry = this.windows.get(clientId);
    if (!entry) return 0;
    return Math.ceil((this.windowMs - (Date.now() - entry.windowStart)) / 1000);
  }
}
