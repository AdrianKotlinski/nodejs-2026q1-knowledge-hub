import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { createFileWriter } from './log-rotation.writer';

export class AppLogger extends ConsoleLogger {
  private readonly writer: (entry: Record<string, unknown>) => void;

  constructor() {
    const level = (process.env.LOG_LEVEL ?? 'log') as LogLevel;
    super('App', { logLevels: [level] });
    const maxFileSizeKb = parseInt(process.env.LOG_MAX_FILE_SIZE ?? '1024', 10);
    this.writer = createFileWriter('logs/app.log', maxFileSizeKb * 1024);
  }

  log(message: string, context?: string) {
    super.log(message, context);
    this.writer({ level: 'log', message, context });
  }

  error(message: string, stack?: string, context?: string) {
    super.error(message, stack, context);
    this.writer({ level: 'error', message, stack, context });
  }

  warn(message: string, context?: string) {
    super.warn(message, context);
    this.writer({ level: 'warn', message, context });
  }

  debug(message: string, context?: string) {
    super.debug(message, context);
    this.writer({ level: 'debug', message, context });
  }

  verbose(message: string, context?: string) {
    super.verbose(message, context);
    this.writer({ level: 'verbose', message, context });
  }
}
