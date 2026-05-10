import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ArticleModule } from '../article/article.module';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { VectorStoreService } from './vector-store.service';
import { EmbeddingService } from './embedding.service';
import { ChunkingService } from './chunking.service';
import { ConversationService } from './conversation.service';

@Module({
  imports: [AiModule, ArticleModule],
  controllers: [RagController],
  providers: [
    RagService,
    VectorStoreService,
    EmbeddingService,
    ChunkingService,
    ConversationService,
  ],
})
export class RagModule {}
