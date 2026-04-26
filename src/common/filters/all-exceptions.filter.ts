import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      const raw =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? exception.message);
      message = Array.isArray(raw) ? raw.join(', ') : raw;
    } else {
      statusCode = 500;
      message = 'An unexpected error occurred';
    }

    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(`${req.method} ${req.url} → ${statusCode}: ${message}`, stack);

    res.status(statusCode).json(
      statusCode === 500
        ? { statusCode, error: 'Internal Server Error', message }
        : { statusCode, message },
    );
  }
}
