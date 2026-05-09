import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { AiCacheService } from './cache.service';
import { AiRateLimitService } from './rate-limit.service';
import { AiUsageTrackingService } from './usage-tracking.service';
import { AiObservabilityService } from './observability.service';
import { AiSessionService } from './session.service';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
  providers: [
    GeminiService,
    AiCacheService,
    AiRateLimitService,
    AiUsageTrackingService,
    AiObservabilityService,
    AiSessionService,
  ],
})
export class AiModule {}
