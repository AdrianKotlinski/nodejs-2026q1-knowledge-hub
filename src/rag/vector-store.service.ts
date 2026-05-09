import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface ChunkPoint {
  id: string;
  vector: number[];
  payload: {
    articleId: string;
    articleTitle: string;
    chunk: string;
    chunkIndex: number;
    status: string;
    categoryId: string | null;
    tags: string[];
  };
}

export interface SearchResult {
  articleId: string;
  articleTitle: string;
  chunk: string;
  similarity: number;
}

export interface SearchFilter {
  status?: string;
  categoryId?: string;
  tags?: string[];
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly client: QdrantClient;
  private readonly collection =
    process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';

  constructor() {
    this.client = new QdrantClient({
      url: process.env.RAG_VECTOR_DB_URL ?? 'http://localhost:6333',
    });
  }

  async onModuleInit() {
    const maxAttempts = 10;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { collections } = await this.client.getCollections();
        const exists = collections.some((c) => c.name === this.collection);
        if (!exists) {
          await this.client.createCollection(this.collection, {
            vectors: { size: 768, distance: 'Cosine' },
          });
          this.logger.log(`Created Qdrant collection: ${this.collection}`);
        } else {
          this.logger.log(`Qdrant collection ready: ${this.collection}`);
        }
        return;
      } catch (err) {
        if (attempt === maxAttempts) {
          this.logger.error(
            `Failed to connect to vector database after ${maxAttempts} attempts`,
          );
          throw new ServiceUnavailableException('Vector database unavailable');
        }
        this.logger.warn(
          `Qdrant not ready, retrying (${attempt}/${maxAttempts})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  async upsertChunks(points: ChunkPoint[]): Promise<void> {
    try {
      await this.client.upsert(this.collection, { wait: true, points });
    } catch (err) {
      this.logger.error(`Upsert failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Vector database unavailable');
    }
  }

  async searchSimilar(
    vector: number[],
    limit: number,
    filter?: SearchFilter,
  ): Promise<SearchResult[]> {
    try {
      const must: object[] = [];
      if (filter?.status) {
        must.push({ key: 'status', match: { value: filter.status } });
      }
      if (filter?.categoryId) {
        must.push({ key: 'categoryId', match: { value: filter.categoryId } });
      }
      if (filter?.tags?.length) {
        must.push({ key: 'tags', match: { any: filter.tags } });
      }

      const results = await this.client.search(this.collection, {
        vector,
        limit,
        with_payload: true,
        ...(must.length ? { filter: { must } } : {}),
      });

      return results.map((r) => ({
        articleId: r.payload?.articleId as string,
        articleTitle: r.payload?.articleTitle as string,
        chunk: r.payload?.chunk as string,
        similarity: r.score,
      }));
    } catch (err) {
      this.logger.error(`Search failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Vector database unavailable');
    }
  }

  async deleteByArticleId(articleId: string): Promise<void> {
    try {
      await this.client.delete(this.collection, {
        filter: { must: [{ key: 'articleId', match: { value: articleId } }] },
      });
    } catch (err) {
      this.logger.error(`Delete failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Vector database unavailable');
    }
  }

  async countByArticleId(articleId: string): Promise<number> {
    try {
      const result = await this.client.count(this.collection, {
        filter: { must: [{ key: 'articleId', match: { value: articleId } }] },
      });
      return result.count;
    } catch (err) {
      this.logger.error(`Count failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Vector database unavailable');
    }
  }
}
