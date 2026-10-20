import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  // Les signatures, tampons et logos transitent en base64 : on autorise des corps volumineux.
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port);
  logger.log(`API Contrat Manager démarrée sur http://localhost:${port}/api`);
}

bootstrap();
