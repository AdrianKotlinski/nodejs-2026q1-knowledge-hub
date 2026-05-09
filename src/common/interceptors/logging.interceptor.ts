import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => {
      const lower = k.toLowerCase();
      if (lower === 'password' || lower.includes('token'))
        return [k, '[REDACTED]'];
      return [k, v];
    }),
  );
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url, query, body } = req;
    const start = Date.now();

    this.logger.log(
      `→ ${method} ${url} | query: ${JSON.stringify(query)} | body: ${JSON.stringify(sanitize(body))}`,
    );

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        this.logger.log(
          `← ${method} ${url} | ${res.statusCode} | ${Date.now() - start}ms`,
        );
      }),
    );
  }
}
