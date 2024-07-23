import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import mongoose from 'mongoose';
import { AllExceptionsFilter } from './infrastructure/filter/http-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('NODE_ENV', process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'test') {
    mongoose.set('debug', true);
  }

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  app.setGlobalPrefix('/api');
  await app.listen(3000);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
