import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app.logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ExcludePasswordInterceptor } from './common/interceptors/exclude-password.interceptor';

async function bootstrap() {
  const logger = new AppLogger();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ExcludePasswordInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('REST API for a Knowledge Hub platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  const server = await app.listen(process.env.PORT ?? 4000);
  logger.log(`Application running on port ${process.env.PORT ?? 4000}`);

  async function shutdown(signal: string) {
    logger.error(`${signal} received — shutting down`);
    await app.close();
    server.close(() => process.exit(1));
  }

  process.on('uncaughtException', (err: Error) => {
    logger.error(`Uncaught exception: ${err.message}`, err.stack);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger.error(`Unhandled rejection: ${err.message}`, err.stack);
    shutdown('unhandledRejection');
  });
}
bootstrap();
