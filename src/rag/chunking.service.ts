import { Injectable } from '@nestjs/common';

export interface ChunkWithMeta {
  chunk: string;
  chunkIndex: number;
  articleId: string;
  articleTitle: string;
  status: string;
  categoryId: string | null;
  tags: string[];
}

@Injectable()
export class ChunkingService {
  private readonly chunkSize = parseInt(
    process.env.RAG_CHUNK_SIZE ?? '800',
    10,
  );
  private readonly chunkOverlap = parseInt(
    process.env.RAG_CHUNK_OVERLAP ?? '200',
    10,
  );

  chunkText(text: string): string[] {
    const chunks: string[] = [];
    const step = this.chunkSize - this.chunkOverlap;
    let start = 0;

    while (start < text.length) {
      chunks.push(text.slice(start, start + this.chunkSize));
      if (start + this.chunkSize >= text.length) break;
      start += step;
    }

    return chunks;
  }

  chunkArticle(article: {
    id: string;
    title: string;
    content: string;
    status: string;
    categoryId: string | null;
    tags: string[];
  }): ChunkWithMeta[] {
    const fullText = `${article.title}\n\n${article.content}`;
    return this.chunkText(fullText).map((chunk, chunkIndex) => ({
      chunk,
      chunkIndex,
      articleId: article.id,
      articleTitle: article.title,
      status: article.status,
      categoryId: article.categoryId,
      tags: article.tags,
    }));
  }
}
