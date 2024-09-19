// product.module.ts
import { Module } from '@nestjs/common';
import { ProductUseCases } from '../application/use-cases/product.use-cases';
import { MongooseProductRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-product-repository.adapter';
import { ProductController } from '../interfaces/http/product.controller';

@Module({
  providers: [
    {
      provide: 'ProductRepositoryPort',
      useClass: MongooseProductRepositoryAdapter,
    },
    ProductUseCases,
  ],
  controllers: [ProductController],
  exports: [ProductUseCases],
})
export class ProductModule {}
