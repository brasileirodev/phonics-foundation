import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readConfig } from './config';
import { ErrorFilter } from '../adapters/http/error-filter';
export async function createApp() {
  const config = readConfig();
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  app.enableCors({
    origin: config.origin,
    methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
  });
  app.useGlobalFilters(new ErrorFilter());
  app.enableShutdownHooks();
  return app;
}
