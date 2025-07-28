import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import mongoose from 'mongoose';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './infrastructure/filter/http-exception-filter';
import './instrument';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'dev') {
    mongoose.set('debug', true);
  }

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  app.setGlobalPrefix('/api');

  // Configurar Swagger solo en desarrollo
  if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'sandbox') {
    const config = new DocumentBuilder()
      .setTitle('Stock Module API')
      .setDescription('API para gestión de stock y carritos')
      .setVersion('1.0')
      .addTag('guest-carts', 'Carritos para usuarios no autenticados')
      .addTag('carts', 'Carritos para usuarios autenticados')
      .addTag('products', 'Productos')
      .addTag('users', 'Usuarios')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT || 8080);

  console.log(`Application is running on: ${await app.getUrl()}`);
  
  // Mostrar URL de Swagger solo si está habilitado
  if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'sandbox') {
    console.log(`Swagger documentation available at: ${await app.getUrl()}/api/docs`);
  }
}
bootstrap();
