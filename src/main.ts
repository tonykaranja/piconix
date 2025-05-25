import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './middleware/http-exception.filter';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure raw body parser for audio/mp3
  app.use(express.raw({
    type: ['audio/mp3'],
    limit: '10mb'
  }));

  // Configure JSON parser for other requests
  app.use(express.json({
    type: ['application/json'],
    limit: '10mb'
  }));

  await app.listen(process.env.PORT ?? 3000);
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost), app.get('LOGGER')));
  console.info(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
