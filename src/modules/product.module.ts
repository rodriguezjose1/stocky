// product.module.ts
import { Module } from '@nestjs/common';
import { ProductUseCases } from '../application/use-cases/product.use-cases';
import { MongooseProductRepositoryAdapter } from '../infrastructure/adapters/mongoose/product/mongoose-product-repository.adapter';
import { ProductController } from '../interfaces/http/product.controller';
import { CategoryModule } from './category.module';
import { FilterProduct } from 'src/infrastructure/adapters/mongoose/product/filter-product';

@Module({
  imports: [CategoryModule],
  providers: [
    {
      provide: 'ProductRepositoryPort',
      useClass: MongooseProductRepositoryAdapter,
    },
    ProductUseCases,
    FilterProduct,
  ],
  controllers: [ProductController],
  exports: [ProductUseCases],
})
export class ProductModule {}
