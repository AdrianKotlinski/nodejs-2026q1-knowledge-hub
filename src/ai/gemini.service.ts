import { Injectable, Logger, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

interface GeminiResponse {
  candidates: { content: { parts: { text: string }[] } }[];
  usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
}

export interface GeminiResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly baseUrl = process.env.GEMINI_API_BASE_URL ?? 'https://generativelanguage.googleapis.com';
  private readonly model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

  async generate(prompt: string, attempt = 0): Promise<GeminiResult> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === 'TimeoutError';
      this.logger.error(`Gemini request failed: ${isTimeout ? 'timeout' : 'network error'}`);
      if (attempt < 3) {
        await this.backoff(attempt);
        return this.generate(prompt, attempt + 1);
      }
      throw new ServiceUnavailableException('AI service temporarily unavailable');
    }

    if (response.status === 429) {
      if (attempt < 3) {
        await this.backoff(attempt);
        return this.generate(prompt, attempt + 1);
      }
      throw new ServiceUnavailableException('AI service rate limit exceeded');
    }

    if (response.status === 401 || response.status === 403) {
      this.logger.error('Gemini authentication failed — check GEMINI_API_KEY');
      throw new InternalServerErrorException('AI service configuration error');
    }

    if (!response.ok) {
      this.logger.error(`Gemini upstream error: ${response.status}`);
      if (attempt < 3) {
        await this.backoff(attempt);
        return this.generate(prompt, attempt + 1);
      }
      throw new ServiceUnavailableException('AI service temporarily unavailable');
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const usage = data.usageMetadata;

    return {
      text,
      promptTokens: usage?.promptTokenCount ?? 0,
      completionTokens: usage?.candidatesTokenCount ?? 0,
      totalTokens: usage?.totalTokenCount ?? 0,
    };
  }

  private backoff(attempt: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 500));
  }
}
