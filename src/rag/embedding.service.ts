import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

interface EmbeddingResponse {
  embedding: { values: number[] };
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly baseUrl =
    process.env.GEMINI_API_BASE_URL ??
    'https://generativelanguage.googleapis.com';
  private readonly model =
    process.env.GEMINI_EMBEDDING_MODEL ?? 'text-embedding-004';

  async embed(text: string): Promise<number[]> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${this.model}`,
          content: { parts: [{ text }] },
        }),
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      this.logger.error('Embedding request failed: network error');
      throw new ServiceUnavailableException('AI embedding service unavailable');
    }

    if (!response.ok) {
      this.logger.error(`Embedding upstream error: ${response.status}`);
      throw new ServiceUnavailableException('AI embedding service unavailable');
    }

    const data = (await response.json()) as EmbeddingResponse;
    return data.embedding.values;
  }
}
