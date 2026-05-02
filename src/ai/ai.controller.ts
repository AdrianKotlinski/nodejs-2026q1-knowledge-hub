import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Res,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GeminiService } from './gemini.service';
import { AiCacheService } from './cache.service';
import { AiRateLimitService } from './rate-limit.service';
import { AiUsageTrackingService } from './usage-tracking.service';
import { AiObservabilityService } from './observability.service';
import { AiSessionService } from './session.service';
import { ArticleService } from '../article/article.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GenerateDto } from './dto/generate.dto';
import {
  buildSummarizePrompt,
  buildTranslatePrompt,
  buildAnalyzePrompt,
} from './prompts';
import {
  parseJsonFromText,
  validateTranslateResult,
  validateAnalyzeResult,
} from './validators/ai-response.validator';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip ?? 'unknown';
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    private readonly gemini: GeminiService,
    private readonly cache: AiCacheService,
    private readonly rateLimit: AiRateLimitService,
    private readonly usage: AiUsageTrackingService,
    private readonly observability: AiObservabilityService,
    private readonly session: AiSessionService,
    private readonly articles: ArticleService,
  ) {}

  @Post('articles/:id/summarize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Summarize an article using AI' })
  @ApiResponse({ status: 200, description: 'Summary generated' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async summarize(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SummarizeArticleDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = getClientIp(req);
    try {
      this.rateLimit.check(ip);
    } catch (err) {
      const retryAfter = this.rateLimit.getRetryAfter(ip);
      res.setHeader('Retry-After', retryAfter);
      throw err;
    }

    const article = await this.articles.findOne(id);
    const maxLength = dto.maxLength!;
    const cacheKey = this.cache.buildKey(
      'summarize',
      id,
      maxLength,
      article.updatedAt,
    );
    const start = Date.now();

    const cached = this.cache.get<{ summary: string }>(cacheKey);
    if (cached) {
      this.observability.recordRequest('summarize', Date.now() - start, true);
      return res.json({
        articleId: id,
        summary: cached.summary,
        originalLength: article.content.length,
        summaryLength: cached.summary.length,
        cached: true,
      });
    }

    const prompt = buildSummarizePrompt(
      article.title,
      article.content,
      maxLength,
    );
    const result = await this.gemini.generate(prompt);
    const latencyMs = Date.now() - start;

    this.usage.record('summarize', result);
    this.observability.recordRequest('summarize', latencyMs, false);
    this.cache.set(cacheKey, { summary: result.text });

    return res.json({
      articleId: id,
      summary: result.text,
      originalLength: article.content.length,
      summaryLength: result.text.length,
      cached: false,
    });
  }

  @Post('articles/:id/translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Translate an article using AI' })
  @ApiResponse({ status: 200, description: 'Translation generated' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async translate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TranslateArticleDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = getClientIp(req);
    try {
      this.rateLimit.check(ip);
    } catch (err) {
      const retryAfter = this.rateLimit.getRetryAfter(ip);
      res.setHeader('Retry-After', retryAfter);
      throw err;
    }

    const article = await this.articles.findOne(id);
    const cacheKey = this.cache.buildKey(
      'translate',
      id,
      dto.targetLanguage,
      dto.sourceLanguage,
      article.updatedAt,
    );
    const start = Date.now();

    const cached = this.cache.get<{
      translatedText: string;
      detectedLanguage: string;
    }>(cacheKey);
    if (cached) {
      this.observability.recordRequest('translate', Date.now() - start, true);
      return res.json({ articleId: id, ...cached, cached: true });
    }

    const prompt = buildTranslatePrompt(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );
    const result = await this.gemini.generate(prompt);
    const latencyMs = Date.now() - start;

    const parsed = parseJsonFromText(result.text);
    const validated = validateTranslateResult(parsed ?? result.text);

    this.usage.record('translate', result);
    this.observability.recordRequest('translate', latencyMs, false);
    this.cache.set(cacheKey, validated);

    return res.json({ articleId: id, ...validated, cached: false });
  }

  @Post('articles/:id/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze an article using AI' })
  @ApiResponse({ status: 200, description: 'Analysis generated' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async analyze(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnalyzeArticleDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = getClientIp(req);
    try {
      this.rateLimit.check(ip);
    } catch (err) {
      const retryAfter = this.rateLimit.getRetryAfter(ip);
      res.setHeader('Retry-After', retryAfter);
      throw err;
    }

    const article = await this.articles.findOne(id);
    const task = dto.task!;
    const start = Date.now();

    const prompt = buildAnalyzePrompt(article.title, article.content, task);
    const result = await this.gemini.generate(prompt);
    const latencyMs = Date.now() - start;

    const parsed = parseJsonFromText(result.text);
    const validated = validateAnalyzeResult(parsed ?? {});

    this.usage.record('analyze', result);
    this.observability.recordRequest('analyze', latencyMs, false);

    return res.json({ articleId: id, task, ...validated });
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generic AI text generation with optional session context',
  })
  @ApiResponse({ status: 200, description: 'Text generated' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async generate(
    @Body() dto: GenerateDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = getClientIp(req);
    try {
      this.rateLimit.check(ip);
    } catch (err) {
      const retryAfter = this.rateLimit.getRetryAfter(ip);
      res.setHeader('Retry-After', retryAfter);
      throw err;
    }

    const start = Date.now();
    let prompt = dto.prompt;

    if (dto.sessionId) {
      const history = this.session.getHistory(dto.sessionId);
      prompt = this.session.buildContextualPrompt(history, dto.prompt);
    }

    const result = await this.gemini.generate(prompt);
    const latencyMs = Date.now() - start;

    if (dto.sessionId) {
      this.session.addTurn(dto.sessionId, 'user', dto.prompt);
      this.session.addTurn(dto.sessionId, 'model', result.text);
    }

    this.usage.record('generate', result);
    this.observability.recordRequest('generate', latencyMs, false);

    return res.json({
      text: result.text,
      sessionId: dto.sessionId,
      tokens: {
        prompt: result.promptTokens,
        completion: result.completionTokens,
        total: result.totalTokens,
      },
    });
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get AI usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  getUsage() {
    return this.usage.getStats();
  }

  @Get('diagnostics')
  @ApiOperation({ summary: 'Get AI observability diagnostics' })
  @ApiResponse({ status: 200, description: 'Observability metrics' })
  getDiagnostics() {
    return this.observability.getDiagnostics();
  }
}
