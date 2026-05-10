import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ArticleService } from '../article/article.service';
import { GeminiService } from '../ai/gemini.service';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService, ChunkPoint } from './vector-store.service';
import { ConversationService } from './conversation.service';
import { IndexRagDto } from './dto/index-rag.dto';

@Injectable()
export class RagService {
  constructor(
    private readonly articleService: ArticleService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly geminiService: GeminiService,
    private readonly conversationService: ConversationService,
  ) {}

  async index(dto: IndexRagDto) {
    const status = dto.onlyPublished !== false ? 'published' : undefined;
    let articles = await this.articleService.findAll(status);

    if (dto.articleIds?.length) {
      articles = articles.filter((a) => dto.articleIds!.includes(a.id));
    }

    let indexedChunks = 0;

    for (const article of articles) {
      await this.vectorStoreService.deleteByArticleId(article.id);

      const chunks = this.chunkingService.chunkArticle(article);
      const points: ChunkPoint[] = [];

      for (const chunk of chunks) {
        const vector = await this.embeddingService.embed(chunk.chunk);
        points.push({
          id: randomUUID(),
          vector,
          payload: {
            articleId: chunk.articleId,
            articleTitle: chunk.articleTitle,
            chunk: chunk.chunk,
            chunkIndex: chunk.chunkIndex,
            status: chunk.status,
            categoryId: chunk.categoryId,
            tags: chunk.tags,
          },
        });
      }

      if (points.length > 0) {
        await this.vectorStoreService.upsertChunks(points);
        indexedChunks += points.length;
      }
    }

    return {
      indexedArticles: articles.length,
      indexedChunks,
      vectorCollection:
        process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles',
    };
  }

  async deleteArticleFromIndex(articleId: string): Promise<void> {
    const count = await this.vectorStoreService.countByArticleId(articleId);
    if (count === 0) {
      throw new NotFoundException(
        `No index entries found for article ${articleId}`,
      );
    }
    await this.vectorStoreService.deleteByArticleId(articleId);
  }

  async search(dto: {
    query: string;
    limit?: number;
    articleStatus?: string;
    categoryId?: string;
    tags?: string[];
  }) {
    const vector = await this.embeddingService.embed(dto.query);
    const results = await this.vectorStoreService.searchSimilar(
      vector,
      dto.limit ?? 5,
      {
        status: dto.articleStatus,
        categoryId: dto.categoryId,
        tags: dto.tags,
      },
    );
    return { results };
  }

  async chat(dto: { question: string; conversationId?: string }) {
    const conversationId = this.conversationService.ensureConversationId(
      dto.conversationId,
    );

    const vector = await this.embeddingService.embed(dto.question);
    const chunks = await this.vectorStoreService.searchSimilar(vector, 5);

    const context = chunks
      .map((c) => `[Article: "${c.articleTitle}"]\n${c.chunk}`)
      .join('\n\n---\n\n');

    const history = this.conversationService.getHistory(conversationId);
    const historyText = history
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = [
      'You are a knowledge base assistant. Answer the question using ONLY the context below.',
      'If the context does not contain enough information, say so honestly.',
      '',
      'Context:',
      context,
      ...(historyText ? ['', 'Conversation history:', historyText] : []),
      '',
      `Question: ${dto.question}`,
    ].join('\n');

    const { text: answer } = await this.geminiService.generate(prompt);

    this.conversationService.addMessage(conversationId, 'user', dto.question);
    this.conversationService.addMessage(conversationId, 'assistant', answer);

    return {
      answer,
      sources: chunks.map((c) => ({
        articleId: c.articleId,
        articleTitle: c.articleTitle,
        relevantChunk: c.chunk,
      })),
      conversationId,
    };
  }
}
