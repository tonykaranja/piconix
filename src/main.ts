import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './middleware/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost), app.get('LOGGER')));
  console.info(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
